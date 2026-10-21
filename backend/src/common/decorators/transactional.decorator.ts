/**
 * @Transactional — INV-30 : toute opération multi-étapes (≥2 lignes critiques)
 * s'exécute dans prisma.$transaction ; pas de semi-réussi observable.
 *
 * Implémentation : Proxy sur le PrismaService injecté. La méthode décorée reçoit
 * un `this` dont `this.prisma` est un client transactionnel (interactive tx).
 * Le client externe n'est PAS modifié (pas de fuite entre appels).
 *
 * Limite volontaire : ne pas décorer une méthode qui appelle `prisma.$transaction`
 * elle-même (imbriqué non supporté par Prisma) — lever une erreur explicite.
 */
import { PrismaClient } from '@prisma/client';

type HasPrisma = { prisma: PrismaClient };

const TRANSACTION_OPTIONS = {
  // isolation serializable refusée pour perfs ; read committed + SELECT FOR UPDATE (INV-03) suffit
  maxWait: 5_000,
  timeout: 30_000,
} as const;

export function Transactional(): MethodDecorator {
  // Signature contrainte par MethodDecorator (TS2322) : le typage métier du `this`
  // (HasPrisma) est rétabli par un cast interne, pas dans la signature publique.
  return (_target: object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>): void => {
    const original = descriptor.value as ((this: HasPrisma, ...args: any[]) => Promise<unknown>) | undefined;
    if (typeof original !== 'function') {
      throw new Error(`@Transactional can only decorate methods (${String(propertyKey)})`);
    }
    descriptor.value = function (this: HasPrisma, ...args: any[]): Promise<unknown> {
      const outer = this.prisma;
      if (!outer || typeof (outer as PrismaClient).$transaction !== 'function') {
        throw new Error(`@Transactional on ${String(propertyKey)}: this.prisma is not a PrismaClient`);
      }
      return (outer as PrismaClient).$transaction(async (tx) => {
        // Proxy : la méthode métier lit `this.prisma` → client transactionnel ;
        // tout le reste du `this` (autres services, clock…) passe tel quel.
        const scoped = new Proxy(this, {
          get(target, prop, receiver) {
            if (prop === 'prisma') return tx;
            return Reflect.get(target, prop, receiver);
          },
        });
        return original.apply(scoped, args);
      }, TRANSACTION_OPTIONS);
    };
  };
}

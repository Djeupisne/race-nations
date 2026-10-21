/**
 * PrismaService — client unique et transactionnel (INV-03).
 * - Un seul pool par process ; les repositories l'utilisent via `this.prisma`.
 * - `$transaction` interactif + SELECT ... FOR UPDATE dans wallet.repository :
 *   AUCUN service ne doit écrire une colonne monétaire sans passer par le repository.
 * - onStart/onShutdown gérés par Nest (enableShutdownHooks dans main.ts).
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query', 'warn', 'error'],
      // timeouts courts : un lock wallet qui traîne = incident, pas une attente silencieuse
      transactionOptions: { maxWait: 5_000, timeout: 30_000 },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

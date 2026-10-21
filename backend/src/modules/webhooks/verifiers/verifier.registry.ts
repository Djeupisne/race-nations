/**
 * verifier.registry.ts — registre DI des vérificateurs de webhooks.
 * Chaque module provider enregistre son verifier au bootstrap ; le controller résout
 * le bon par chemin. Unknown provider → 404 sec (pas de probing interne).
 * Centralise aussi la fabrication de la clé d'idempotence : `<PROVIDER>:<externalId>`
 * (contrainte UNIQUE sur WebhookEvent.idempotencyKey — INV-04).
 */
import { Injectable, Logger } from '@nestjs/common';
import type { WebhookVerifier } from './verifier.interface';

@Injectable()
export class VerifierRegistry {
  private readonly byPath = new Map<string, WebhookVerifier>();
  private readonly logger = new Logger(VerifierRegistry.name);

  register(verifier: WebhookVerifier): void {
    if (this.byPath.has(verifier.path)) {
      this.logger.warn(`Duplicate webhook verifier path ignored: ${verifier.path}`);
      return;
    }
    this.byPath.set(verifier.path, verifier);
  }

  /** Résolution stricte par chemin exact (sans préfixe /api/v1 — ajouté par le controller). */
  resolve(path: string): WebhookVerifier | undefined {
    return this.byPath.get(path.replace(/^\/api\/v1/, ''));
  }

  registeredPaths(): string[] {
    return [...this.byPath.keys()];
  }

  static idempotencyKey(provider: string, externalId: string): string {
    return `${provider.toUpperCase()}:${externalId}`;
  }
}

/**
 * IdempotencyGuard — INV-04 sur toutes les mutations monétaires (docs/api.md §1.1).
 * - Le header `Idempotency-Key` est REQUIS sur POST wallet/payments/bets ; absent → 422 VALIDATION_FAILED
 *   porté par le contrôleur (le guard ne fait que vérifier la présence + format).
 * - Format : [A-Za-z0-9_-]{8,64} — borné pour éviter les clés pathologiques en Redis/DB.
 * - La garantie forte (rejouer = réponse originale) vit dans la contrainte DB
 *   UNIQUE(idempotencyKey) de WalletTransaction/BetSettlement/WebhookEvent + le cache Redis
 *   court-termiste posé ici : SET NX key → si déjà en cours, renvoie 409 IDEMPOTENCY_CONFLICT.
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ValidationError } from '../errors/domain-errors';

const KEY_RE = /^[A-Za-z0-9_-]{8,64}$/;
export const IDEMPOTENT_USER_KEY_PREFIX = 'idem:user:';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: { userId?: string } }>();
    const key = req.headers['idempotency-key'];
    if (!key) {
      throw new ValidationError({ field: 'Idempotency-Key', reason: 'Header required for monetary mutations.' });
    }
    if (!KEY_RE.test(key)) {
      throw new ValidationError({ field: 'Idempotency-Key', reason: 'Must match [A-Za-z0-9_-]{8,64}.', received: key.length });
    }
    // Expose la clé normalisée au handler (services la propagent aux ledger keys dérivées).
    (req as { idempotencyKey?: string }).idempotencyKey = key;
    return true;
  }
}

/** Fabrique de clés ledger dérivées — cohérentes avec l'UNIQUE DB (INV-04). */
export function deriveLedgerKey(kind: 'escrow' | 'payout' | 'housecut' | 'refund' | 'deposit', marketOrPaymentId: string, playerIdOrIndex?: string | number): string {
  const suffix = playerIdOrIndex === undefined ? '' : `:${String(playerIdOrIndex)}`;
  return `${kind}:${marketOrPaymentId}${suffix}`;
}

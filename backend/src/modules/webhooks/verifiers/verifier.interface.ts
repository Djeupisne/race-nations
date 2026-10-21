/**
 * verifier.interface.ts — contrat commun des vérificateurs de webhooks (INV-26, INV-04).
 * Un verifier est PURE : il ne touche jamais la base ni les wallets. Il transforme une
 * requête HTTP brute en verdict { valid, externalId, paymentRef?, eventKind? }.
 * La persistance WebhookEvent + l'exécution métier appartiennent à webhooks.service.
 */
import type { Request } from 'express';

export type VerifiedEventKind = 'PAYMENT_SUCCEEDED' | 'PAYMENT_FAILED' | 'GAME_RESULT' | 'OTHER';

export interface WebhookVerdict {
  /** Signature du transport vérifiée en temps constant + timestamp frais. */
  valid: boolean;
  /** Raison technique si invalide — journalisable (jamais secrète). */
  reason?: 'MALFORMED' | 'TIMESTAMP_STALE' | 'NO_MATCHING_SIGNATURE' | 'UNKNOWN_EVENT';
  /** Id externe du provider — base de la clé d'idempotence `<provider>:<externalId>`. */
  externalId?: string;
  /** Référence interne résolue depuis le payload (paymentId backend pour un webhook paiement). */
  paymentId?: string;
  /** Référence provider (payment_intent / tx_ref) conservée pour audit. */
  providerRef?: string;
  kind?: VerifiedEventKind;
}

export interface WebhookVerifier {
  /** Identifiant stable stocké dans WebhookEvent.provider ('STRIPE', 'FLUTTERWAVE', ...). */
  readonly provider: string;
  /** Chemin d'enregistrement attendu (ex. '/webhooks/stripe'). */
  readonly path: string;
  verify(req: Request): Promise<WebhookVerdict>;
}

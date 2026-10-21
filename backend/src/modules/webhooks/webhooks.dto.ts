/**
 * webhooks.dto — enveloppes minimales validées APRÈS vérification signature.
 * Le verifier fait le travail de confiance ; ici on ne做强 que typer le
 * strict nécessaire pour router vers le handler métier.
 */
import { z } from 'zod';

/** Événement normalisé interne produit par chaque verifier. */
export const NormalizedWebhookSchema = z.object({
  provider: z.enum(['stripe', 'flutterwave', 'google_play', 'apple', 'huawei']),
  externalId: z.string().min(1).max(128), // event id / notification id
  type: z.string().min(1).max(128), // checkout.session.completed, ...
  paymentRef: z.string().min(1).max(128).optional(), // notre Payment.id si résolu
  payload: z.record(z.unknown()),
  receivedAt: z.string().datetime(),
});

export type NormalizedWebhook = z.infer<typeof NormalizedWebhookSchema>;

/** Query de supervision admin (file d'ingestion). */
export const WebhookListQuerySchema = z.object({
  provider: z.enum(['stripe', 'flutterwave', 'google_play', 'apple', 'huawei']).optional(),
  status: z.enum(['pending', 'processed', 'failed']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type WebhookListQueryDto = z.infer<typeof WebhookListQuerySchema>;

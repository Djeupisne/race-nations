"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookListQuerySchema = exports.NormalizedWebhookSchema = void 0;
/**
 * webhooks.dto — enveloppes minimales validées APRÈS vérification signature.
 * Le verifier fait le travail de confiance ; ici on ne做强 que typer le
 * strict nécessaire pour router vers le handler métier.
 */
var zod_1 = require("zod");
/** Événement normalisé interne produit par chaque verifier. */
exports.NormalizedWebhookSchema = zod_1.z.object({
    provider: zod_1.z.enum(['stripe', 'flutterwave', 'google_play', 'apple', 'huawei']),
    externalId: zod_1.z.string().min(1).max(128), // event id / notification id
    type: zod_1.z.string().min(1).max(128), // checkout.session.completed, ...
    paymentRef: zod_1.z.string().min(1).max(128).optional(), // notre Payment.id si résolu
    payload: zod_1.z.record(zod_1.z.unknown()),
    receivedAt: zod_1.z.string().datetime(),
});
/** Query de supervision admin (file d'ingestion). */
exports.WebhookListQuerySchema = zod_1.z.object({
    provider: zod_1.z.enum(['stripe', 'flutterwave', 'google_play', 'apple', 'huawei']).optional(),
    status: zod_1.z.enum(['pending', 'processed', 'failed']).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(25),
});

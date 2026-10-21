"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookListQuerySchema = exports.NormalizedWebhookSchema = void 0;
const zod_1 = require("zod");
exports.NormalizedWebhookSchema = zod_1.z.object({
    provider: zod_1.z.enum(['stripe', 'flutterwave', 'google_play', 'apple', 'huawei']),
    externalId: zod_1.z.string().min(1).max(128),
    type: zod_1.z.string().min(1).max(128),
    paymentRef: zod_1.z.string().min(1).max(128).optional(),
    payload: zod_1.z.record(zod_1.z.unknown()),
    receivedAt: zod_1.z.string().datetime(),
});
exports.WebhookListQuerySchema = zod_1.z.object({
    provider: zod_1.z.enum(['stripe', 'flutterwave', 'google_play', 'apple', 'huawei']).optional(),
    status: zod_1.z.enum(['pending', 'processed', 'failed']).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(25),
});
//# sourceMappingURL=webhooks.dto.js.map
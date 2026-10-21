"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseReverseSchema = exports.ResolveDisputeSchema = exports.OpenDisputeSchema = exports.ManualSettleSchema = void 0;
const zod_1 = require("zod");
exports.ManualSettleSchema = zod_1.z.object({
    winningSide: zod_1.z.number().int().min(0).max(15).optional(),
    push: zod_1.z.boolean().optional(),
    reason: zod_1.z.string().min(10).max(2000),
});
exports.OpenDisputeSchema = zod_1.z.object({
    reason: zod_1.z.enum(['CHEAT_SUSPECTED', 'RESULT_MISMATCH', 'DISCONNECT_DISPUTE', 'SERVER_FAULT', 'OTHER']),
});
exports.ResolveDisputeSchema = zod_1.z.object({
    outcome: zod_1.z.enum(['REFUND_ALL', 'UPHELD']),
    note: zod_1.z.string().min(10).max(2000),
});
exports.HouseReverseSchema = zod_1.z.object({
    originalTxId: zod_1.z.string().uuid(),
    reason: zod_1.z.string().min(10).max(2000),
});
//# sourceMappingURL=admin.dto.js.map
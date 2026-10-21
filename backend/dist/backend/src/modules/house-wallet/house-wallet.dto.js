"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseReverseSchema = exports.HouseSnapshotQuerySchema = exports.HouseTxQuerySchema = void 0;
const zod_1 = require("zod");
exports.HouseTxQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(500).default(100),
    before: zod_1.z.coerce.date().optional(),
});
exports.HouseSnapshotQuerySchema = zod_1.z.object({
    days: zod_1.z.coerce.number().int().min(1).max(365).default(30),
});
exports.HouseReverseSchema = zod_1.z.object({
    originalTxId: zod_1.z.string().uuid(),
    reason: zod_1.z.string().min(10).max(2000),
});
//# sourceMappingURL=house-wallet.dto.js.map
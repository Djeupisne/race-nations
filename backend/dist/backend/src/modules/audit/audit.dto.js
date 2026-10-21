"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditSearchQuerySchema = void 0;
const zod_1 = require("zod");
exports.AuditSearchQuerySchema = zod_1.z.object({
    actor: zod_1.z.string().uuid().optional(),
    action: zod_1.z.string().min(1).max(64).optional(),
    targetType: zod_1.z.string().min(1).max(64).optional(),
    targetId: zod_1.z.string().min(1).max(64).optional(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(500).default(100),
});
//# sourceMappingURL=audit.dto.js.map
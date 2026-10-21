"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationQueueQuerySchema = exports.DismissReportSchema = exports.FilterTextSchema = void 0;
const zod_1 = require("zod");
exports.FilterTextSchema = zod_1.z.object({
    text: zod_1.z.string().min(1).max(2000),
});
exports.DismissReportSchema = zod_1.z.object({
    note: zod_1.z.string().min(5).max(2000),
});
exports.ModerationQueueQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(200).default(50),
});
//# sourceMappingURL=moderation.dto.js.map
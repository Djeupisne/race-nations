"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecideAppealSchema = exports.AppealSanctionSchema = exports.IssueSanctionSchema = exports.SanctionTypeSchema = void 0;
/**
 * sanctions.dto.ts — schémas Zod des routes de sanctions (docs/api.md §9).
 */
var zod_1 = require("zod");
exports.SanctionTypeSchema = zod_1.z.enum(['WARN', 'CHAT_MUTE', 'BET_RESTRICTION', 'TEMP_BAN_7D', 'PERM_BAN', 'REWARD_CLAWBACK']);
exports.IssueSanctionSchema = zod_1.z.object({
    playerId: zod_1.z.string().uuid(),
    type: exports.SanctionTypeSchema,
    reason: zod_1.z.string().min(5).max(2000),
    evidenceRef: zod_1.z.string().max(200).optional(),
});
exports.AppealSanctionSchema = zod_1.z.object({
    note: zod_1.z.string().min(10).max(2000),
});
exports.DecideAppealSchema = zod_1.z.object({
    decision: zod_1.z.enum(['UPHELD', 'LIFTED']),
});

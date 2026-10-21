"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualSettleSchema = exports.ListMarketsQuerySchema = exports.ResolveDisputeSchema = exports.OpenDisputeSchema = exports.CancelMarketSchema = exports.PlaceBetSchema = exports.CreateMarketSchema = void 0;
/**
 * betting.dto.ts — DTOs Zod des endpoints /api/v1/betting/* (docs/api.md §5).
 * Convention du projet : chaque request body passe par ZodValidationPipe ;
 * les montants sont des ENTIERS STRICTEMENT POSITIFS en unités mineures
 * (INV-01) — jamais de float sur le fil. Les champs sensibles (deviceId,
 * jurisdiction) ne sont JAMAIS acceptés depuis le client : ils sont dérivés
 * côté serveur (anti-contournement, cf. betting.controller).
 */
var zod_1 = require("zod");
/** Unité mineure entière > 0 (credits, gems, tokens, hardCents). */
var PositiveInt = zod_1.z.number().int().positive();
exports.CreateMarketSchema = zod_1.z
    .object({
    currency: zod_1.z.enum(['CREDITS', 'GEMS', 'TOKENS', 'HARD_CENTS']),
    stake: PositiveInt, // mises identiques obligatoires (INV-10)
    trackId: zod_1.z.string().uuid(),
    vehicleId: zod_1.z.string().uuid().optional(),
    opponentId: zod_1.z.string().uuid().optional(), // absent → marché OPEN public
    public: zod_1.z.boolean().default(true),
    tournamentRef: zod_1.z.string().max(64).optional(), // variante tournoi, SOFT v1
})
    .strict();
exports.PlaceBetSchema = zod_1.z
    .object({
    marketId: zod_1.z.string().uuid(),
    side: zod_1.z.union([zod_1.z.literal(0), zod_1.z.literal(1)]), // camp 0/1
})
    .strict();
exports.CancelMarketSchema = zod_1.z
    .object({
    reason: zod_1.z.enum(['NO_OPPONENT', 'RULES_VIOLATION', 'ADMIN', 'TEST']).default('ADMIN'),
})
    .strict();
exports.OpenDisputeSchema = zod_1.z
    .object({
    reason: zod_1.z.enum(['RESULT_MISMATCH', 'SERVER_GONE', 'PLAYER_CONDUCT', 'OTHER']),
    details: zod_1.z.string().min(1).max(2000),
})
    .strict();
exports.ResolveDisputeSchema = zod_1.z
    .object({
    outcome: zod_1.z.enum(['SETTLE_AS_RESULT', 'REFUND_ALL', 'PARTIAL_SETTLE']),
    winningSide: zod_1.z.union([zod_1.z.literal(0), zod_1.z.literal(1)]).optional(),
    note: zod_1.z.string().min(3).max(2000), // tracé dans AdminAuditLog (INV-28)
})
    .strict();
exports.ListMarketsQuerySchema = zod_1.z
    .object({
    status: zod_1.z.enum(['OPEN', 'LOCKED', 'RUNNING', 'DISPUTED', 'SETTLED', 'CANCELLED']).optional(),
    currency: zod_1.z.enum(['CREDITS', 'GEMS', 'TOKENS', 'HARD_CENTS']).optional(),
    trackId: zod_1.z.string().uuid().optional(),
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
})
    .strict();
exports.ManualSettleSchema = zod_1.z
    .object({
    marketId: zod_1.z.string().uuid(),
    winningSide: zod_1.z.union([zod_1.z.literal(0), zod_1.z.literal(1)]).optional(), // absent → push (INV-16)
    note: zod_1.z.string().min(3).max(2000),
})
    .strict();

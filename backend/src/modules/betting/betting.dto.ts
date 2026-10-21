/**
 * betting.dto.ts — DTOs Zod des endpoints /api/v1/betting/* (docs/api.md §5).
 * Convention du projet : chaque request body passe par ZodValidationPipe ;
 * les montants sont des ENTIERS STRICTEMENT POSITIFS en unités mineures
 * (INV-01) — jamais de float sur le fil. Les champs sensibles (deviceId,
 * jurisdiction) ne sont JAMAIS acceptés depuis le client : ils sont dérivés
 * côté serveur (anti-contournement, cf. betting.controller).
 */
import { z } from 'zod';

/** Unité mineure entière > 0 (credits, gems, tokens, hardCents). */
const PositiveInt = z.number().int().positive();

export const CreateMarketSchema = z
  .object({
    currency: z.enum(['CREDITS', 'GEMS', 'TOKENS', 'HARD_CENTS']),
    stake: PositiveInt, // mises identiques obligatoires (INV-10)
    trackId: z.string().uuid(),
    vehicleId: z.string().uuid().optional(),
    opponentId: z.string().uuid().optional(), // absent → marché OPEN public
    public: z.boolean().default(true),
    tournamentRef: z.string().max(64).optional(), // variante tournoi, SOFT v1
  })
  .strict();
export type CreateMarketDto = z.infer<typeof CreateMarketSchema>;

export const PlaceBetSchema = z
  .object({
    marketId: z.string().uuid(),
    side: z.union([z.literal(0), z.literal(1)]), // camp 0/1
  })
  .strict();
export type PlaceBetDto = z.infer<typeof PlaceBetSchema>;

export const CancelMarketSchema = z
  .object({
    reason: z.enum(['NO_OPPONENT', 'RULES_VIOLATION', 'ADMIN', 'TEST']).default('ADMIN'),
  })
  .strict();
export type CancelMarketDto = z.infer<typeof CancelMarketSchema>;

export const OpenDisputeSchema = z
  .object({
    reason: z.enum(['RESULT_MISMATCH', 'SERVER_GONE', 'PLAYER_CONDUCT', 'OTHER']),
    details: z.string().min(1).max(2000),
  })
  .strict();
export type OpenDisputeDto = z.infer<typeof OpenDisputeSchema>;

export const ResolveDisputeSchema = z
  .object({
    outcome: z.enum(['SETTLE_AS_RESULT', 'REFUND_ALL', 'PARTIAL_SETTLE']),
    winningSide: z.union([z.literal(0), z.literal(1)]).optional(),
    note: z.string().min(3).max(2000), // tracé dans AdminAuditLog (INV-28)
  })
  .strict();
export type ResolveDisputeDto = z.infer<typeof ResolveDisputeSchema>;

export const ListMarketsQuerySchema = z
  .object({
    status: z.enum(['OPEN', 'LOCKED', 'RUNNING', 'DISPUTED', 'SETTLED', 'CANCELLED']).optional(),
    currency: z.enum(['CREDITS', 'GEMS', 'TOKENS', 'HARD_CENTS']).optional(),
    trackId: z.string().uuid().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListMarketsQueryDto = z.infer<typeof ListMarketsQuerySchema>;

export const ManualSettleSchema = z
  .object({
    marketId: z.string().uuid(),
    winningSide: z.union([z.literal(0), z.literal(1)]).optional(), // absent → push (INV-16)
    note: z.string().min(3).max(2000),
  })
  .strict();
export type ManualSettleDto = z.infer<typeof ManualSettleSchema>;

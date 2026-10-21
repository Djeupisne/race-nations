/**
 * sanctions.dto.ts — schémas Zod des routes de sanctions (docs/api.md §9).
 */
import { z } from 'zod';

export const SanctionTypeSchema = z.enum(['WARN', 'CHAT_MUTE', 'BET_RESTRICTION', 'TEMP_BAN_7D', 'PERM_BAN', 'REWARD_CLAWBACK']);

export const IssueSanctionSchema = z.object({
  playerId: z.string().uuid(),
  type: SanctionTypeSchema,
  reason: z.string().min(5).max(2000),
  evidenceRef: z.string().max(200).optional(),
});
export type IssueSanctionDto = z.infer<typeof IssueSanctionSchema>;

export const AppealSanctionSchema = z.object({
  note: z.string().min(10).max(2000),
});

export const DecideAppealSchema = z.object({
  decision: z.enum(['UPHELD', 'LIFTED']),
});

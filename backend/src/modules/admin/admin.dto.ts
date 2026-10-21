/**
 * admin.dto.ts — schémas Zod des mutations back-office (docs/api.md §9).
 * Le champ `actor` n'existe JAMAIS dans le body : l'acteur est dérivé de req.user
 * par AdminController (INV-28 anti-usurpation).
 */
import { z } from 'zod';

export const ManualSettleSchema = z.object({
  winningSide: z.number().int().min(0).max(15).optional(),
  push: z.boolean().optional(),
  reason: z.string().min(10).max(2000),
});
export type ManualSettleDto = z.infer<typeof ManualSettleSchema>;

export const OpenDisputeSchema = z.object({
  reason: z.enum(['CHEAT_SUSPECTED', 'RESULT_MISMATCH', 'DISCONNECT_DISPUTE', 'SERVER_FAULT', 'OTHER']),
});

export const ResolveDisputeSchema = z.object({
  outcome: z.enum(['REFUND_ALL', 'UPHELD']),
  note: z.string().min(10).max(2000),
});

export const HouseReverseSchema = z.object({
  originalTxId: z.string().uuid(),
  reason: z.string().min(10).max(2000),
});

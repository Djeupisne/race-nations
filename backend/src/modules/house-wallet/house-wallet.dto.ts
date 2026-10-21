/**
 * house-wallet.dto.ts — requêtes supervision House Wallet (lecture + reversal INCIDENT).
 */
import { z } from 'zod';

export const HouseTxQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  before: z.coerce.date().optional(),
});

export const HouseSnapshotQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const HouseReverseSchema = z.object({
  originalTxId: z.string().uuid(),
  reason: z.string().min(10).max(2000),
});
export type HouseReverseDto = z.infer<typeof HouseReverseSchema>;

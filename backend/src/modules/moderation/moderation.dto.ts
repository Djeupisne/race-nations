/**
 * moderation.dto.ts — schémas Zod des routes de modération (docs/api.md §9).
 */
import { z } from 'zod';

export const FilterTextSchema = z.object({
  text: z.string().min(1).max(2000),
});
export type FilterTextDto = z.infer<typeof FilterTextSchema>;

export const DismissReportSchema = z.object({
  note: z.string().min(5).max(2000),
});
export type DismissReportDto = z.infer<typeof DismissReportSchema>;

export const ModerationQueueQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

/**
 * audit.dto.ts — schémas Zod de la consultation d'audit (docs/api.md §9).
 * bornes : limit 1..500 ; dates ISO validées ; chaîne libre pour action/targetType.
 */
import { z } from 'zod';

export const AuditSearchQuerySchema = z.object({
  actor: z.string().uuid().optional(),
  action: z.string().min(1).max(64).optional(),
  targetType: z.string().min(1).max(64).optional(),
  targetId: z.string().min(1).max(64).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});
export type AuditSearchQuery = z.infer<typeof AuditSearchQuerySchema>;

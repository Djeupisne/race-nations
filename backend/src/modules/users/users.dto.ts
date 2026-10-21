/**
 * users.dto — schémas Zod du module users. Les DTOs sont dérivés (`z.infer`)
 * pour qu'une seule source de vérité existe entre runtime et types.
 */
import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  displayName: z
    .string()
    .min(3, 'displayName must be >= 3 characters')
    .max(24, 'displayName must be <= 24 characters')
    .regex(/^[A-Za-z0-9_.\- ]+$/, 'displayName has invalid characters')
    .optional(),
  avatarKey: z.string().max(64).optional(),
  preferredLanguage: z.string().length(2).optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

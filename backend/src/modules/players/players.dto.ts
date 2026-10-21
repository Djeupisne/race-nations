/**
 * players.dto.ts — DTOs Zod du module joueurs (docs/api.md §3).
 * Inputs `.strict()` (INV-27) ; les schémas de sortie canoniques viennent du contrat
 * partagé (@race-nations/api-contracts/src/player.ts) et sont ré-exposés ici en pipes.
 */
import { z } from 'zod';
import { UpdatePlayerInputSchema, PlayerProfileSchema, PublicPlayerProfileSchema } from '@race-nations/api-contracts';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

export const UpdatePlayerDtoPipe = new ZodValidationPipe(UpdatePlayerInputSchema);
export type { UpdatePlayerInput, PlayerProfile, PublicPlayerProfile } from '@race-nations/api-contracts';
export { PlayerProfileSchema, PublicPlayerProfileSchema };

/** GET /players/:id/leaderboard?trackId=&season= — query params défensifs. */
export const PlayerRecordsQuerySchema = z
  .object({
    trackId: z.string().max(64).optional(),
    season: z.number().int().min(1).max(99).optional(),
  })
  .strict();
export type PlayerRecordsQuery = z.infer<typeof PlayerRecordsQuerySchema>;

/** GET /leaderboards?scope=world|country|division|clan|vehicle|season&limit=&cursor= (api.md §10). */
export const LeaderboardQuerySchema = z
  .object({
    scope: z.enum(['world', 'country', 'division', 'clan', 'vehicle', 'season']).default('world'),
    /** Filtre valeur du scope : countryCode | division | clanId | vehicleId | saison. */
    filter: z.string().max(64).optional(),
    limit: z.number().int().min(1).max(100).default(50),
    cursor: z.string().optional(),
  })
  .strict();
export type LeaderboardQuery = z.infer<typeof LeaderboardQuerySchema>;

/** POST /players/me/nationality — possible UNIQUEMENT avant la 1ʳᵉ course classée (INV-31). */
export const SetNationalityInputSchema = z
  .object({
    nationality: z.string().length(2).regex(/^[A-Z]{2}$/),
  })
  .strict();
export type SetNationalityInput = z.infer<typeof SetNationalityInputSchema>;

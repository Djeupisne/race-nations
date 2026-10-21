"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetNationalityInputSchema = exports.LeaderboardQuerySchema = exports.PlayerRecordsQuerySchema = exports.PublicPlayerProfileSchema = exports.PlayerProfileSchema = exports.UpdatePlayerDtoPipe = void 0;
/**
 * players.dto.ts — DTOs Zod du module joueurs (docs/api.md §3).
 * Inputs `.strict()` (INV-27) ; les schémas de sortie canoniques viennent du contrat
 * partagé (@race-nations/api-contracts/src/player.ts) et sont ré-exposés ici en pipes.
 */
var zod_1 = require("zod");
var api_contracts_1 = require("@race-nations/api-contracts");
Object.defineProperty(exports, "PlayerProfileSchema", { enumerable: true, get: function () { return api_contracts_1.PlayerProfileSchema; } });
Object.defineProperty(exports, "PublicPlayerProfileSchema", { enumerable: true, get: function () { return api_contracts_1.PublicPlayerProfileSchema; } });
var zod_validation_pipe_1 = require("../../common/pipes/zod-validation.pipe");
exports.UpdatePlayerDtoPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.UpdatePlayerInputSchema);
/** GET /players/:id/leaderboard?trackId=&season= — query params défensifs. */
exports.PlayerRecordsQuerySchema = zod_1.z
    .object({
    trackId: zod_1.z.string().max(64).optional(),
    season: zod_1.z.number().int().min(1).max(99).optional(),
})
    .strict();
/** GET /leaderboards?scope=world|country|division|clan|vehicle|season&limit=&cursor= (api.md §10). */
exports.LeaderboardQuerySchema = zod_1.z
    .object({
    scope: zod_1.z.enum(['world', 'country', 'division', 'clan', 'vehicle', 'season']).default('world'),
    /** Filtre valeur du scope : countryCode | division | clanId | vehicleId | saison. */
    filter: zod_1.z.string().max(64).optional(),
    limit: zod_1.z.number().int().min(1).max(100).default(50),
    cursor: zod_1.z.string().optional(),
})
    .strict();
/** POST /players/me/nationality — possible UNIQUEMENT avant la 1ʳᵉ course classée (INV-31). */
exports.SetNationalityInputSchema = zod_1.z
    .object({
    nationality: zod_1.z.string().length(2).regex(/^[A-Z]{2}$/),
})
    .strict();

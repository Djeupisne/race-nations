/**
 * Race Nations — Contrats Joueur (docs/api.md §3).
 * Toutes les valeurs monétaires sont des entiers (INV-01) ; timestamps ISO-8601 UTC
 * produits par Clock.now() serveur (INV-29).
 */
import { z } from 'zod';
import {
  BalancesSchema,
  CountryCodeSchema,
  DivisionSchema,
  UserRoleSchema,
} from './enums';
import { USERNAME_REGEX, USERNAME_MESSAGE } from './auth';

/* ------------------------------ Profil ------------------------------- */

/** GET /players/me — profil complet côté serveur. */
export const PlayerProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  countryCode: CountryCodeSchema,
  /** Nationalité de course — immuable après la 1ʳᵉ course classée (INV-31). */
  nationality: CountryCodeSchema,
  nationalityLocked: z.boolean(),
  role: UserRoleSchema,
  level: z.number().int().min(1),
  xp: z.number().int().nonnegative(),
  plPoints: z.number().int().nonnegative(),
  division: DivisionSchema,
  /** Réputation 0–100. < 30 → pas de paris HARD ni tournois payants (INV-21) ; < 10 → ban 7 j auto. */
  reputation: z.number().int().min(0).max(100),
  ageVerified: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
});
export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;

/** GET /players/:id — profil public (sans PII ni flags KYC). */
export const PublicPlayerProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  nationality: CountryCodeSchema,
  level: z.number().int().min(1),
  plPoints: z.number().int().nonnegative(),
  division: DivisionSchema,
});
export type PublicPlayerProfile = z.infer<typeof PublicPlayerProfileSchema>;

/* ------------------------------ PATCH /me ---------------------------- */

/**
 * Champs éditables uniquement. `nationality` est ABSENT du schéma : impossible
 * à modifier via l'API une fois verrouillée (garde serveur + INV-31).
 */
export const UpdatePlayerInputSchema = z
  .object({
    username: z.string().regex(USERNAME_REGEX, USERNAME_MESSAGE).optional(),
    preferredLanguage: z.enum(['fr', 'en']).optional(),
    chatGlobalEnabled: z.boolean().optional(),
    marketingOptIn: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required.' });
export type UpdatePlayerInput = z.infer<typeof UpdatePlayerInputSchema>;

/* ------------------------------ Stats -------------------------------- */

/** GET /players/me/stats — agrégats de course (source : MatchResult validés uniquement, INV-25). */
export const PlayerStatsSchema = z.object({
  racesPlayed: z.number().int().nonnegative(),
  victories: z.number().int().nonnegative(),
  defeats: z.number().int().nonnegative(),
  draws: z.number().int().nonnegative(),
  abandons: z.number().int().nonnegative(),
  winStreakCurrent: z.number().int().nonnegative(),
  winStreakBest: z.number().int().nonnegative(),
  totalDriftPoints: z.number().int().nonnegative(),
  perfectRaces: z.number().int().nonnegative(),
  recordsHeld: z.number().int().nonnegative(),
  betsWon: z.number().int().nonnegative(),
  betsLost: z.number().int().nonnegative(),
});
export type PlayerStats = z.infer<typeof PlayerStatsSchema>;

/* ------------------------- Soldes & gating pari ----------------------- */

/** GET /wallet/balances (rappel : entiers, SOFT/HARD cloisonnés, INV-02/07). */
export const WalletBalancesSchema = z.object({
  balances: BalancesSchema,
  updatedAt: z.string().datetime({ offset: true }),
});
export type WalletBalances = z.infer<typeof WalletBalancesSchema>;

/** Éligibilité betting calculée SERVER-side uniquement (INV-20/21). */
export const BettingEligibilitySchema = z.object({
  softAllowed: z.boolean(),
  hardAllowed: z.boolean(),
  reasons: z.array(
    z.enum([
      'JURISDICTION_BLOCKED',
      'AGE_VERIFICATION_REQUIRED',
      'REPUTATION_TOO_LOW',
      'DAILY_LIMIT_REACHED',
      'SANCTION_BET_RESTRICTION',
    ]),
  ),
  dailySoftUsedCredits: z.number().int().nonnegative(),
  dailySoftLimitCredits: z.number().int().nonnegative(),
});
export type BettingEligibility = z.infer<typeof BettingEligibilitySchema>;

/* ----------------------------- Leaderboards --------------------------- */

export const LeaderboardScopeSchema = z.enum(['world', 'country', 'division', 'clan', 'vehicle', 'season']);
export type LeaderboardScope = z.infer<typeof LeaderboardScopeSchema>;

export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  playerId: z.string().uuid(),
  username: z.string(),
  nationality: CountryCodeSchema,
  plPoints: z.number().int().nonnegative(),
  division: DivisionSchema,
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

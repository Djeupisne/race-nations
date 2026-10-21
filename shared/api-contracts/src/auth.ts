/**
 * Race Nations — Contrats Auth (docs/api.md §2).
 * Inputs validés par ZodValidationPipe côté serveur (INV-27) ; schémas `.strict()`
 * pour refuser tout champ inconnu en requête.
 */
import { z } from 'zod';
import { CountryCodeSchema, UserRoleSchema, type UserRole } from './enums';

/* ----------------------------- Register ----------------------------- */

export const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;
export const USERNAME_MESSAGE =
  'Username must be 3-20 characters: letters, digits, underscore or hyphen.';

/**
 * Politique mot de passe : 8–128, au moins une minuscule, une majuscule et un chiffre.
 * `nationality` est le choix DÉFINITIF du pays de course (INV-31 : non modifiable
 * après la 1ʳᵉ course classée — verrouillé serveur, pas seulement client).
 */
export const RegisterInputSchema = z
  .object({
    email: z.string().email().max(254).toLowerCase(),
    username: z.string().regex(USERNAME_REGEX, USERNAME_MESSAGE),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(128)
      .regex(/[a-z]/, 'Password must contain a lowercase letter.')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
      .regex(/[0-9]/, 'Password must contain a digit.'),
    countryCode: CountryCodeSchema,
    nationality: CountryCodeSchema,
    /** Consentements légaux stockés avec horodatage (RGPD + termes). */
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: 'Terms must be accepted.' }),
    }),
    acceptedPrivacy: z.literal(true, {
      errorMap: () => ({ message: 'Privacy policy must be accepted.' }),
    }),
    marketingOptIn: z.boolean().default(false),
  })
  .strict();
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

/* ------------------------------ Login ------------------------------- */

export const LoginInputSchema = z
  .object({
    email: z.string().email().max(254).toLowerCase(),
    password: z.string().min(1).max(128),
    /** Token store mobile le cas échéant (Google Play / App Store / Huawei) — échange IAP. */
    platformToken: z.string().max(2048).optional(),
  })
  .strict();
export type LoginInput = z.infer<typeof LoginInputSchema>;

/* ----------------------------- Tokens -------------------------------- */

/** access 15 min (900 s), refresh rotatif 30 j (2 592 000 s) — docs/api.md §2. */
export const ACCESS_TOKEN_TTL_SECONDS = 900;
export const REFRESH_TOKEN_TTL_SECONDS = 2_592_000;

export const TokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('Bearer').default('Bearer'),
  expiresIn: z.number().int().positive(),
});
export type TokenPair = z.infer<typeof TokenPairSchema>;

export const RefreshInputSchema = z
  .object({ refreshToken: z.string().min(20).max(512) })
  .strict();
export type RefreshInput = z.infer<typeof RefreshInputSchema>;

export const LogoutInputSchema = z
  .object({ refreshToken: z.string().min(20).max(512) })
  .strict();
export type LogoutInput = z.infer<typeof LogoutInputSchema>;

/* -------------------------- Verify age (KYC) ------------------------- */

/**
 * Vérification d'âge ≥ 18 ans — prérequis paris HARD (INV-21).
 * Le document est chiffré au repos, jamais loggé en clair (observability.md §2, RGPD).
 */
export const VerifyAgeInputSchema = z
  .object({
    documentType: z.enum(['NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE']),
    /** Base64 du document chiffré côté client (AES via clé de session) ou URL présignée uploadée. */
    documentPayload: z.string().min(64).max(10_485_760),
  })
  .strict();
export type VerifyAgeInput = z.infer<typeof VerifyAgeInputSchema>;

export const AgeVerificationStatusSchema = z.object({
  verified: z.boolean(),
  /** ISO-8601 UTC posé par Clock.now() serveur (INV-29). */
  verifiedAt: z.string().datetime({ offset: true }).nullable(),
  birthDateConfirmed: z.boolean().default(false),
});
export type AgeVerificationStatus = z.infer<typeof AgeVerificationStatusSchema>;

/* --------------------------- JWT claims ------------------------------ */

/** Claims de l'access token. `sub` = userId (UUID). Pas de PII dans le JWT. */
export interface AccessTokenClaims {
  sub: string;
  role: UserRole;
  /** Version de famille de refresh — bump à chaque rotation complète (détection vol). */
  fam: number;
  iat: number;
  exp: number;
  iss: 'race-nations-api';
  aud: 'race-nations-clients';
}

/** Payload minimal du refresh token (stocké hashé en DB, rotation obligatoire). */
export interface RefreshTokenClaims {
  sub: string;
  jti: string;
  fam: number;
}

/* ---------------------------- Session -------------------------------- */

/** Réponse GET /auth/me — identité + gating utile aux clients. */
export const AuthSessionSchema = z.object({
  userId: z.string().uuid(),
  username: z.string(),
  role: UserRoleSchema,
  countryCode: CountryCodeSchema,
  nationality: CountryCodeSchema,
  ageVerified: z.boolean(),
  bettingHardAllowed: z.boolean(),
  accessTokenExpiresAt: z.string().datetime({ offset: true }),
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;

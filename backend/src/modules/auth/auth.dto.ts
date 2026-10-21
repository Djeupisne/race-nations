/**
 * auth.dto.ts — DTOs d'entrée Auth, validés Zod (INV-27) via ZodValidationPipe.
 * Les schémas canoniques vivent dans @race-nations/api-contracts (src/auth.ts) :
 * ce fichier les ré-expose sous forme de pipes prêts pour les contrôleurs Nest,
 * et ajoute les DTOs spécifiques backend non contractuels (réponse interne).
 */
import {
  RegisterInputSchema,
  LoginInputSchema,
  RefreshInputSchema,
  LogoutInputSchema,
  VerifyAgeInputSchema,
} from '@race-nations/api-contracts';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

export const RegisterDtoPipe = new ZodValidationPipe(RegisterInputSchema);
export const LoginDtoPipe = new ZodValidationPipe(LoginInputSchema);
export const RefreshDtoPipe = new ZodValidationPipe(RefreshInputSchema);
export const LogoutDtoPipe = new ZodValidationPipe(LogoutInputSchema);
export const VerifyAgeDtoPipe = new ZodValidationPipe(VerifyAgeInputSchema);

// Ré-export des types pour les services (pas de duplication de schéma — source unique contrat).
export type {
  RegisterInput,
  LoginInput,
  RefreshInput,
  LogoutInput,
  VerifyAgeInput,
  TokenPair,
  AuthSession,
  AccessTokenClaims,
} from '@race-nations/api-contracts';

/** Identité injectée dans la requête par JwtStrategy (shape stable consommée par tous les guards). */
export interface AuthenticatedUser {
  userId: string;
  playerId: string;
  role: 'PLAYER' | 'MODERATOR' | 'ADMIN' | 'SYSTEM';
  /** Version de famille du refresh token courant (détection de réutilisation, REFRESH_REUSED). */
  family: number;
}

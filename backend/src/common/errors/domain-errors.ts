/**
 * Erreurs de domaine transverses (wallet, auth, états, ressources).
 * Chaque classe porte le code métier stable et le HTTP status associé
 * (docs/api.md §1.2) — ne jamais instancier AppError directement pour
 * un cas couvert par une de ces classes (lisibilité + tests d'invariants).
 */
import { AppError, AppErrorOptions } from './app-error';

/** INV-02 — débit refusé : `UPDATE ... WHERE balance >= amount` n'a rien matché. */
export class InsufficientFundsError extends AppError {
  constructor(
    readonly walletId: string,
    readonly required: number,
    readonly available: number,
    options: AppErrorOptions = {},
  ) {
    super(
      'INSUFFICIENT_FUNDS',
      `Insufficient funds: required ${required}, available ${available}.`,
      { details: { walletId, required, available }, ...options },
    );
  }
}

/** INV-04 — même idempotencyKey avec un payload différent → conflit (le replay strict est renvoyé ailleurs). */
export class IdempotencyConflictError extends AppError {
  constructor(readonly idempotencyKey: string, options: AppErrorOptions = {}) {
    super('IDEMPOTENCY_CONFLICT', `Idempotency key already used with a different request: ${idempotencyKey}.`, {
      details: { idempotencyKey },
      ...options,
    });
  }
}

/** INV-22 — transition hors graphe autorisé ; N'EST JAMAIS persistée. */
export class InvalidStateTransitionError extends AppError {
  constructor(
    readonly machine: string,
    readonly from: string,
    readonly to: string,
    options: AppErrorOptions = {},
  ) {
    super('INVALID_STATE_TRANSITION', `Invalid ${machine} state transition: ${from} -> ${to}.`, {
      details: { machine, from, to },
      ...options,
    });
  }
}

/** Ressource inexistante ou invisible pour l'appelant (pas d'enumeration : 404 uniforme). */
export class NotFoundError extends AppError {
  constructor(readonly resource: string, readonly id?: string, options: AppErrorOptions = {}) {
    super('NOT_FOUND', `${resource} not found${id ? `: ${id}` : '.'}`, { details: { resource, id }, ...options });
  }
}

/** Authz INV-28 — rôle ADMIN/MODERATOR requis (settle manuel, sanctions, House Wallet). */
export class ForbiddenAdminError extends AppError {
  constructor(options: AppErrorOptions = {}, message = 'Administrator privileges required.') {
    super('FORBIDDEN_ADMIN', message, options);
  }
}

/** Auth — JWT absent/expiré/valide mais non authentifié. */
export class AuthUnauthenticatedError extends AppError {
  constructor(options: AppErrorOptions = {}, message = 'Authentication required.') {
    super('AUTH_UNAUTHENTICATED', message, options);
  }
}

/** Access token expiré → le client doit appeler /auth/refresh. */
export class TokenExpiredError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super('TOKEN_EXPIRED', 'Access token has expired.', options);
  }
}

/** Rotation INV-23/auth : un refresh déjà consommé est réutilisé → famille révoquée. */
export class RefreshReusedError extends AppError {
  constructor(readonly family: number, options: AppErrorOptions = {}) {
    super('REFRESH_REUSED', 'Refresh token reuse detected; token family revoked.', {
      details: { family },
      ...options,
    });
  }
}

/** Validation Zod échouée (INV-27) — portée par ZodValidationPipe. */
export class ValidationError extends AppError {
  constructor(issues: unknown, options: AppErrorOptions = {}) {
    super('VALIDATION_FAILED', 'Request validation failed.', { details: { issues }, ...options });
  }
}

/** Rate limiting dépassé (guard). */
export class RateLimitedError extends AppError {
  constructor(readonly retryAfterSeconds: number, options: AppErrorOptions = {}) {
    super('RATE_LIMITED', `Too many requests. Retry after ${retryAfterSeconds}s.`, {
      details: { retryAfterSeconds },
      ...options,
    });
  }
}

/** Version d'API retirée (docs/api-versioning.md). */
export class ApiVersionRetiredError extends AppError {
  constructor(readonly version: string, options: AppErrorOptions = {}) {
    super('API_VERSION_RETIRED', `API version ${version} is retired.`, { details: { version }, ...options });
  }
}

/** Dépendance critique indisponible (DB/Redis/fleet) → 503, jamais de semi-écritures. */
export class ServerUnavailableError extends AppError {
  constructor(readonly dependency: string, options: AppErrorOptions = {}) {
    super('SERVER_UNAVAILABLE', `Dependency unavailable: ${dependency}.`, { details: { dependency }, ...options });
  }
}

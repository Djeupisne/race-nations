/**
 * AppError — socle d'erreur unique du backend (docs/api.md §1.2, RFC-7807 simplifié).
 *
 * Règles :
 *  - Tout code métier provient de `ErrorCode` (shared/api-contracts/src/enums.ts) ;
 *    jamais de code inventé localement (contrat stable, ne jamais changer le HTTP status).
 *  - `toJSON()` produit exactement l'enveloppe API : { statusCode, code, message, details?, requestId }.
 *  - Les erreurs de domaine (domain-errors.ts) et betting (betting-errors.ts) étendent cette classe.
 */
import { randomUUID } from 'node:crypto';

/** Codes métier stables — miroir exact de ErrorCodeSchema (shared/api-contracts/src/enums.ts). */
export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'AUTH_UNAUTHENTICATED',
  'TOKEN_EXPIRED',
  'REFRESH_REUSED',
  'FORBIDDEN_ADMIN',
  'AGE_VERIFICATION_REQUIRED',
  'REPUTATION_TOO_LOW',
  'JURISDICTION_BLOCKED',
  'INSUFFICIENT_FUNDS',
  'IDEMPOTENCY_CONFLICT',
  'INVALID_STATE_TRANSITION',
  'BET_ALREADY_SETTLED',
  'BET_STAKE_MISMATCH',
  'BET_STAKE_OUT_OF_RANGE',
  'BET_DAILY_LIMIT_EXCEEDED',
  'RATE_LIMITED',
  'NOT_FOUND',
  'API_VERSION_RETIRED',
  'INTERNAL',
  'SERVER_UNAVAILABLE',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Mapping code → HTTP status (docs/api.md §1.2). figé — contrat d'API. */
export const ERROR_HTTP_STATUS: Readonly<Record<ErrorCode, number>> = {
  VALIDATION_FAILED: 422,
  AUTH_UNAUTHENTICATED: 401,
  TOKEN_EXPIRED: 401,
  REFRESH_REUSED: 401,
  FORBIDDEN_ADMIN: 403,
  AGE_VERIFICATION_REQUIRED: 403,
  REPUTATION_TOO_LOW: 403,
  JURISDICTION_BLOCKED: 403,
  INSUFFICIENT_FUNDS: 409,
  IDEMPOTENCY_CONFLICT: 409,
  INVALID_STATE_TRANSITION: 409,
  BET_ALREADY_SETTLED: 409,
  BET_STAKE_MISMATCH: 422,
  BET_STAKE_OUT_OF_RANGE: 422,
  BET_DAILY_LIMIT_EXCEEDED: 422,
  RATE_LIMITED: 429,
  NOT_FOUND: 404,
  API_VERSION_RETIRED: 410,
  INTERNAL: 500,
  SERVER_UNAVAILABLE: 503,
};

export interface AppErrorOptions {
  /** Détails structurés non sensibles (bornes, ids publics…). Jamais de secret ni PII. */
  details?: Record<string, unknown>;
  /** UUID de corrélation — propager celui du middleware si déjà généré. */
  requestId?: string;
}

/**
 * Erreur applicative de base. C'est LE seul type d'erreur que le filtre global
 * (all-exceptions.filter.ts) mappe vers l'enveloppe API ; toute autre erreur
 * remontée est convertie en INTERNAL (500) sans fuite de stack.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;
  readonly requestId: string;

  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.statusCode = ERROR_HTTP_STATUS[code];
    this.details = options.details;
    this.requestId = options.requestId ?? randomUUID();
    Error.captureStackTrace?.(this, new.target);
  }

  /** Enveloppe d'erreur API (docs/api.md §1.2). */
  toJSON(): {
    statusCode: number;
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    requestId: string;
  } {
    return {
      statusCode: this.statusCode,
      code: this.code,
      message: this.message,
      ...(this.details !== undefined ? { details: this.details } : {}),
      requestId: this.requestId,
    };
  }

  /** Fabrique générique — utile pour les cas simples sans classe dédiée. */
  static create(code: ErrorCode, message: string, options?: AppErrorOptions): AppError {
    return new AppError(code, message, options);
  }
}

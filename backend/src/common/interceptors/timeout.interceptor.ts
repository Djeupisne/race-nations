/**
 * TimeoutInterceptor — budget de latence par route (docs/observability.md : SLO p95).
 * Délpassement → SERVER_UNAVAILABLE (503) avec la requête annulée côté réponse ;
 * les mutations monétaires doivent être idempotentes (INV-04) pour que le client
 * puisse rejouer en sécurité après un timeout.
 * Budgets : lecture 2 s, écriture standard 5 s, settlement/paiement 10 s (worker asynchrone au-delà).
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, TimeoutError, catchError, throwError, timeout } from 'rxjs';
import { ServerUnavailableError } from '../errors/domain-errors';

export interface TimeoutMeta {
  /** budget ms — défaut 5_000. */
  ms?: number;
  /** nom du dependency pour le log d'incident. */
  label?: string;
}

export const TIMEOUT_META_KEY = 'route:timeout';
export const requestTimeout = (meta: TimeoutMeta) => (target: unknown, key?: string, desc?: PropertyDescriptor) => {
  const holder = desc ? desc.value : key ? target[key as keyof typeof target] : target;
  Reflect.defineMetadata(TIMEOUT_META_KEY, meta, holder as object);
};

const DEFAULT_MS = 5_000;

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = Reflect.getMetadata?.(TIMEOUT_META_KEY, context.getHandler?.()) as TimeoutMeta | undefined;
    const ms = meta?.ms ?? DEFAULT_MS;
    return next.handle().pipe(
      timeout(ms),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new ServerUnavailableError(meta?.label ?? 'request-budget'));
        }
        return throwError(() => err);
      }),
    );
  }
}

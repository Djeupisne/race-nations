/**
 * LoggingInterceptor — journal structuré d'accès API (docs/observability.md).
 * Une ligne par requête : méthode, route, statut, durée, requestId, userId.
 * Aucune donnée sensible (body, tokens) n'est loggée.
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { requestId?: string; user?: { sub?: string } }>();
    const start = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = http.getResponse<Response>();
          const ms = Number(process.hrtime.bigint() - start) / 1e6;
          this.logger.log(
            JSON.stringify({
              t: 'http',
              m: req.method,
              p: req.originalUrl?.split('?')[0],
              s: res.statusCode,
              d: Math.round(ms * 10) / 10,
              rid: req.requestId,
              uid: req.user?.sub,
            }),
          );
        },
        error: (err: unknown) => {
          const ms = Number(process.hrtime.bigint() - start) / 1e6;
          const status = err instanceof Object && 'getStatus' in err
            ? (err as { getStatus: () => number }).getStatus()
            : 500;
          this.logger.warn(
            JSON.stringify({
              t: 'http',
              m: req.method,
              p: req.originalUrl?.split('?')[0],
              s: status,
              d: Math.round(ms * 10) / 10,
              rid: req.requestId,
              err: true,
            }),
          );
        },
      }),
    );
  }
}

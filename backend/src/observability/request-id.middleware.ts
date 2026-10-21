/**
 * RequestIdMiddleware — corrégation X-Request-Id (docs/observability.md §2).
 * Réutilise l'header client si présent (format contrôlé), sinon UUID v4.
 * Propagé sur req.requestId, loggé par LoggingInterceptor, renvoyé en réponse
 * et dans les enveloppes d'erreur (traçabilité incident sans fuite interne).
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const SAFE_ID = /^[A-Za-z0-9_-]{8,64}$/;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request & { requestId?: string }, res: Response, next: NextFunction): void {
    const incoming = req.header('x-request-id') ?? '';
    req.requestId = SAFE_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    next();
  }
}

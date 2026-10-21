/**
 * audit.interceptor.ts — traçabilité automatique des routes /admin/* :
 * génère un requestId (corrélé aux logs, docs/observability.md §4) et l'expose
 * sur req.auditRequestId. L'écriture AdminAuditLog RESTE explicite dans les services
 * (un INSERT par décision métier — jamais un bruit systématique en POST-write).
 */
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class AuditRequestInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { auditRequestId?: string }>();
    req.auditRequestId = (req.headers['x-request-id'] as string) || randomUUID();
    return next.handle();
  }
}

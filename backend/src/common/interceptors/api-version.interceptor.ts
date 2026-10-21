/**
 * ApiVersionInterceptor — header X-API-Version sur toutes les réponses
 * (docs/api-versioning.md §3). Le versionnement réel est URI (/api/v1) ;
 * ce header permet au client de confirmer la version servie.
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
// Stables, alignés sur shared/api-contracts/src/version.ts
export const API_VERSION_HEADER = 'X-API-Version';
export const CURRENT_API_VERSION = 'v1';

@Injectable()
export class ApiVersionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const res = context.switchToHttp().getResponse<Response>();
    res.setHeader(API_VERSION_HEADER, CURRENT_API_VERSION);
    return next.handle();
  }
}

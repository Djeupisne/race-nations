import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare const API_VERSION_HEADER = "X-API-Version";
export declare const CURRENT_API_VERSION = "v1";
export declare class ApiVersionInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}

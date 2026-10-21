import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface TimeoutMeta {
    ms?: number;
    label?: string;
}
export declare const TIMEOUT_META_KEY = "route:timeout";
export declare const requestTimeout: (meta: TimeoutMeta) => (target: object, key?: string, desc?: PropertyDescriptor) => void;
export declare class TimeoutInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}

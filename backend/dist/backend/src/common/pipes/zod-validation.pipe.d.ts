import { PipeTransform } from '@nestjs/common';
import { z } from 'zod';
export declare class ZodValidationPipe<T extends z.ZodTypeAny> implements PipeTransform<unknown, z.infer<T>> {
    private readonly schema;
    constructor(schema: T);
    transform(value: unknown): z.infer<T>;
}
export declare function zodQueryPipe<T extends z.ZodTypeAny>(schema: T): ZodValidationPipe<T>;

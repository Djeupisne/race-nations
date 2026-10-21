/**
 * ZodValidationPipe — validation stricte INV-27 (docs/api-versioning.md §5).
 * Input serveur : valeur inconnue/en extra → VALIDATION_FAILED (422) — .strict()
 * sur tous les DTO body ; output client : mapping défensif côté consommateur.
 * Utilisé comme pipe global optionnel ou par-route : @Body(new ZodValidationPipe(CreateBetDto)).
 */
import { PipeTransform, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { ValidationError } from '../errors/domain-errors';

@Injectable()
export class ZodValidationPipe<T extends z.ZodTypeAny> implements PipeTransform<unknown, z.infer<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          code: i.code,
          message: i.message,
        })),
      );
    }
    return parsed.data;
  }
}

/** Variante query/params : mêmes erreurs, préfixe de champ différent pour le debug. */
export function zodQueryPipe<T extends z.ZodTypeAny>(schema: T): ZodValidationPipe<T> {
  return new ZodValidationPipe(schema);
}

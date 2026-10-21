/**
 * payments.dto — schémas Zod des endpoints de paiement (docs/api.md §6).
 * Le montant est en CENTIMES HARD, borne 1 000..100 000 (10$..1000$) ;
 * toute autre valeur = ValidationError. La devise n'est PAS fournie par le
 * client : elle est dérivée serveur de la juridiction du joueur.
 */
import { z } from 'zod';

export const MIN_DEPOSIT_CENTS = 1_000;
export const MAX_DEPOSIT_CENTS = 100_000;

export const CheckoutSchema = z.object({
  provider: z.enum(['stripe', 'flutterwave']),
  amountCents: z
    .number()
    .int('amountCents must be an integer')
    .min(MIN_DEPOSIT_CENTS, `Deposit minimum is ${MIN_DEPOSIT_CENTS} cents`)
    .max(MAX_DEPOSIT_CENTS, `Deposit maximum is ${MAX_DEPOSIT_CENTS} cents`),
  idempotencyKey: z.string().min(8).max(64),
});

export type CheckoutDto = z.infer<typeof CheckoutSchema>;

export const ListPaymentsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type ListPaymentsQueryDto = z.infer<typeof ListPaymentsQuerySchema>;

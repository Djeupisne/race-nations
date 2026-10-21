"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListPaymentsQuerySchema = exports.CheckoutSchema = exports.MAX_DEPOSIT_CENTS = exports.MIN_DEPOSIT_CENTS = void 0;
/**
 * payments.dto — schémas Zod des endpoints de paiement (docs/api.md §6).
 * Le montant est en CENTIMES HARD, borne 1 000..100 000 (10$..1000$) ;
 * toute autre valeur = ValidationError. La devise n'est PAS fournie par le
 * client : elle est dérivée serveur de la juridiction du joueur.
 */
var zod_1 = require("zod");
exports.MIN_DEPOSIT_CENTS = 1000;
exports.MAX_DEPOSIT_CENTS = 100000;
exports.CheckoutSchema = zod_1.z.object({
    provider: zod_1.z.enum(['stripe', 'flutterwave']),
    amountCents: zod_1.z
        .number()
        .int('amountCents must be an integer')
        .min(exports.MIN_DEPOSIT_CENTS, "Deposit minimum is ".concat(exports.MIN_DEPOSIT_CENTS, " cents"))
        .max(exports.MAX_DEPOSIT_CENTS, "Deposit maximum is ".concat(exports.MAX_DEPOSIT_CENTS, " cents")),
    idempotencyKey: zod_1.z.string().min(8).max(64),
});
exports.ListPaymentsQuerySchema = zod_1.z.object({
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(25),
});

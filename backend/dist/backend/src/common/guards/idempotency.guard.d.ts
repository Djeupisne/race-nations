import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare const IDEMPOTENT_USER_KEY_PREFIX = "idem:user:";
export declare class IdempotencyGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
export declare function deriveLedgerKey(kind: 'escrow' | 'payout' | 'housecut' | 'refund' | 'deposit', marketOrPaymentId: string, playerIdOrIndex?: string | number): string;

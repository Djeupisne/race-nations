export type CurrencyKind = 'SOFT' | 'HARD';
export declare function assertIntegerAmount(amount: number, label?: string): number;
export declare function floorDiv(numerator: number, denominator: number): number;
export declare function floorRemainder(numerator: number, denominator: number): number;
export declare function applyBpsFloor(amount: number, bps: number): number;
export declare function addSigned(balance: number, delta: number): number;
export declare function formatHardCents(cents: number, locale?: string, currency?: string): string;

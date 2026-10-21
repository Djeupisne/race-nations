export interface Clock {
    now(): Date;
    nowMs(): number;
}
export declare class SystemClock implements Clock {
    now(): Date;
    nowMs(): number;
}
export declare class FixedClock implements Clock {
    private current;
    constructor(startMs?: number | string);
    now(): Date;
    nowMs(): number;
    set(ms: number | string): void;
    advance(ms: number): void;
}
export declare const CLOCK: unique symbol;
export declare const clock: Clock;
export declare function ageMs(sinceEpochMs: number, clock: Clock): number;

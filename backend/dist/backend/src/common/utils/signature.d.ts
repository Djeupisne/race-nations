export declare function signPayload(secret: string, timestamp: number | string, rawBody: string): string;
export declare function signRaw(secret: string, rawBody: string): string;
export declare function verifySignatureConstantTime(expectedHex: string, providedHex: string): boolean;
export declare function isTimestampFresh(timestampMs: number, nowMs: number, windowMs: number): boolean;
export declare function verifySignedHeader(headerValue: string, rawBody: string, secret: string, nowMs: number, toleranceMs?: number): {
    valid: boolean;
    reason?: 'MALFORMED' | 'TIMESTAMP_STALE' | 'NO_MATCHING_SIGNATURE';
};

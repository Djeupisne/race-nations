import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
export declare const RegisterDtoPipe: ZodValidationPipe<import("zod").ZodObject<{
    email: import("zod").ZodString;
    username: import("zod").ZodString;
    password: import("zod").ZodString;
    countryCode: import("zod").ZodString;
    nationality: import("zod").ZodString;
    acceptedTerms: import("zod").ZodLiteral<true>;
    acceptedPrivacy: import("zod").ZodLiteral<true>;
    marketingOptIn: import("zod").ZodDefault<import("zod").ZodBoolean>;
}, "strict", import("zod").ZodTypeAny, {
    email: string;
    username: string;
    password: string;
    countryCode: string;
    nationality: string;
    acceptedTerms: true;
    acceptedPrivacy: true;
    marketingOptIn: boolean;
}, {
    email: string;
    username: string;
    password: string;
    countryCode: string;
    nationality: string;
    acceptedTerms: true;
    acceptedPrivacy: true;
    marketingOptIn?: boolean | undefined;
}>>;
export declare const LoginDtoPipe: ZodValidationPipe<import("zod").ZodObject<{
    email: import("zod").ZodString;
    password: import("zod").ZodString;
    platformToken: import("zod").ZodOptional<import("zod").ZodString>;
}, "strict", import("zod").ZodTypeAny, {
    email: string;
    password: string;
    platformToken?: string | undefined;
}, {
    email: string;
    password: string;
    platformToken?: string | undefined;
}>>;
export declare const RefreshDtoPipe: ZodValidationPipe<import("zod").ZodObject<{
    refreshToken: import("zod").ZodString;
}, "strict", import("zod").ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>>;
export declare const LogoutDtoPipe: ZodValidationPipe<import("zod").ZodObject<{
    refreshToken: import("zod").ZodString;
}, "strict", import("zod").ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>>;
export declare const VerifyAgeDtoPipe: ZodValidationPipe<import("zod").ZodObject<{
    documentType: import("zod").ZodEnum<["NATIONAL_ID", "PASSPORT", "DRIVERS_LICENSE"]>;
    documentPayload: import("zod").ZodString;
}, "strict", import("zod").ZodTypeAny, {
    documentType: "NATIONAL_ID" | "PASSPORT" | "DRIVERS_LICENSE";
    documentPayload: string;
}, {
    documentType: "NATIONAL_ID" | "PASSPORT" | "DRIVERS_LICENSE";
    documentPayload: string;
}>>;
export type { RegisterInput, LoginInput, RefreshInput, LogoutInput, VerifyAgeInput, TokenPair, AuthSession, AccessTokenClaims, } from '@race-nations/api-contracts';
export interface AuthenticatedUser {
    userId: string;
    playerId: string;
    role: 'PLAYER' | 'MODERATOR' | 'ADMIN' | 'SYSTEM';
    family: number;
}

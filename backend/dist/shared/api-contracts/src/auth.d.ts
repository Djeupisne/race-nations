import { z } from 'zod';
import { type UserRole } from './enums';
export declare const USERNAME_REGEX: RegExp;
export declare const USERNAME_MESSAGE = "Username must be 3-20 characters: letters, digits, underscore or hyphen.";
export declare const RegisterInputSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
    countryCode: z.ZodString;
    nationality: z.ZodString;
    acceptedTerms: z.ZodLiteral<true>;
    acceptedPrivacy: z.ZodLiteral<true>;
    marketingOptIn: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
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
}>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export declare const LoginInputSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    platformToken: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    email: string;
    password: string;
    platformToken?: string | undefined;
}, {
    email: string;
    password: string;
    platformToken?: string | undefined;
}>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export declare const ACCESS_TOKEN_TTL_SECONDS = 900;
export declare const REFRESH_TOKEN_TTL_SECONDS = 2592000;
export declare const TokenPairSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    tokenType: z.ZodDefault<z.ZodLiteral<"Bearer">>;
    expiresIn: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
    accessToken: string;
    tokenType: "Bearer";
    expiresIn: number;
}, {
    refreshToken: string;
    accessToken: string;
    expiresIn: number;
    tokenType?: "Bearer" | undefined;
}>;
export type TokenPair = z.infer<typeof TokenPairSchema>;
export declare const RefreshInputSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strict", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export type RefreshInput = z.infer<typeof RefreshInputSchema>;
export declare const LogoutInputSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strict", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export type LogoutInput = z.infer<typeof LogoutInputSchema>;
export declare const VerifyAgeInputSchema: z.ZodObject<{
    documentType: z.ZodEnum<["NATIONAL_ID", "PASSPORT", "DRIVERS_LICENSE"]>;
    documentPayload: z.ZodString;
}, "strict", z.ZodTypeAny, {
    documentType: "NATIONAL_ID" | "PASSPORT" | "DRIVERS_LICENSE";
    documentPayload: string;
}, {
    documentType: "NATIONAL_ID" | "PASSPORT" | "DRIVERS_LICENSE";
    documentPayload: string;
}>;
export type VerifyAgeInput = z.infer<typeof VerifyAgeInputSchema>;
export declare const AgeVerificationStatusSchema: z.ZodObject<{
    verified: z.ZodBoolean;
    verifiedAt: z.ZodNullable<z.ZodString>;
    birthDateConfirmed: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    verified: boolean;
    verifiedAt: string | null;
    birthDateConfirmed: boolean;
}, {
    verified: boolean;
    verifiedAt: string | null;
    birthDateConfirmed?: boolean | undefined;
}>;
export type AgeVerificationStatus = z.infer<typeof AgeVerificationStatusSchema>;
export interface AccessTokenClaims {
    sub: string;
    role: UserRole;
    fam: number;
    iat: number;
    exp: number;
    iss: 'race-nations-api';
    aud: 'race-nations-clients';
}
export interface RefreshTokenClaims {
    sub: string;
    jti: string;
    fam: number;
}
export declare const AuthSessionSchema: z.ZodObject<{
    userId: z.ZodString;
    username: z.ZodString;
    role: z.ZodEnum<["PLAYER", "MODERATOR", "ADMIN", "SYSTEM"]>;
    countryCode: z.ZodString;
    nationality: z.ZodString;
    ageVerified: z.ZodBoolean;
    bettingHardAllowed: z.ZodBoolean;
    accessTokenExpiresAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    countryCode: string;
    nationality: string;
    userId: string;
    role: "PLAYER" | "MODERATOR" | "ADMIN" | "SYSTEM";
    ageVerified: boolean;
    bettingHardAllowed: boolean;
    accessTokenExpiresAt: string;
}, {
    username: string;
    countryCode: string;
    nationality: string;
    userId: string;
    role: "PLAYER" | "MODERATOR" | "ADMIN" | "SYSTEM";
    ageVerified: boolean;
    bettingHardAllowed: boolean;
    accessTokenExpiresAt: string;
}>;
export type AuthSession = z.infer<typeof AuthSessionSchema>;

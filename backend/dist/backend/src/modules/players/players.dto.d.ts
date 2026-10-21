import { z } from 'zod';
import { PlayerProfileSchema, PublicPlayerProfileSchema } from '@race-nations/api-contracts';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
export declare const UpdatePlayerDtoPipe: ZodValidationPipe<z.ZodEffects<z.ZodObject<{
    username: z.ZodOptional<z.ZodString>;
    preferredLanguage: z.ZodOptional<z.ZodEnum<["fr", "en"]>>;
    chatGlobalEnabled: z.ZodOptional<z.ZodBoolean>;
    marketingOptIn: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    username?: string | undefined;
    marketingOptIn?: boolean | undefined;
    preferredLanguage?: "fr" | "en" | undefined;
    chatGlobalEnabled?: boolean | undefined;
}, {
    username?: string | undefined;
    marketingOptIn?: boolean | undefined;
    preferredLanguage?: "fr" | "en" | undefined;
    chatGlobalEnabled?: boolean | undefined;
}>, {
    username?: string | undefined;
    marketingOptIn?: boolean | undefined;
    preferredLanguage?: "fr" | "en" | undefined;
    chatGlobalEnabled?: boolean | undefined;
}, {
    username?: string | undefined;
    marketingOptIn?: boolean | undefined;
    preferredLanguage?: "fr" | "en" | undefined;
    chatGlobalEnabled?: boolean | undefined;
}>>;
export type { UpdatePlayerInput, PlayerProfile, PublicPlayerProfile } from '@race-nations/api-contracts';
export { PlayerProfileSchema, PublicPlayerProfileSchema };
export declare const PlayerRecordsQuerySchema: z.ZodObject<{
    trackId: z.ZodOptional<z.ZodString>;
    season: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    season?: number | undefined;
    trackId?: string | undefined;
}, {
    season?: number | undefined;
    trackId?: string | undefined;
}>;
export type PlayerRecordsQuery = z.infer<typeof PlayerRecordsQuerySchema>;
export declare const LeaderboardQuerySchema: z.ZodObject<{
    scope: z.ZodDefault<z.ZodEnum<["world", "country", "division", "clan", "vehicle", "season"]>>;
    filter: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    limit: number;
    scope: "clan" | "division" | "world" | "country" | "vehicle" | "season";
    filter?: string | undefined;
    cursor?: string | undefined;
}, {
    filter?: string | undefined;
    cursor?: string | undefined;
    limit?: number | undefined;
    scope?: "clan" | "division" | "world" | "country" | "vehicle" | "season" | undefined;
}>;
export type LeaderboardQuery = z.infer<typeof LeaderboardQuerySchema>;
export declare const SetNationalityInputSchema: z.ZodObject<{
    nationality: z.ZodString;
}, "strict", z.ZodTypeAny, {
    nationality: string;
}, {
    nationality: string;
}>;
export type SetNationalityInput = z.infer<typeof SetNationalityInputSchema>;

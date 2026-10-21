import { z } from 'zod';
export declare const UpdateProfileSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    avatarKey: z.ZodOptional<z.ZodString>;
    preferredLanguage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    preferredLanguage?: string | undefined;
    displayName?: string | undefined;
    avatarKey?: string | undefined;
}, {
    preferredLanguage?: string | undefined;
    displayName?: string | undefined;
    avatarKey?: string | undefined;
}>;
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

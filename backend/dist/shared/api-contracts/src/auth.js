"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSessionSchema = exports.AgeVerificationStatusSchema = exports.VerifyAgeInputSchema = exports.LogoutInputSchema = exports.RefreshInputSchema = exports.TokenPairSchema = exports.REFRESH_TOKEN_TTL_SECONDS = exports.ACCESS_TOKEN_TTL_SECONDS = exports.LoginInputSchema = exports.RegisterInputSchema = exports.USERNAME_MESSAGE = exports.USERNAME_REGEX = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
exports.USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;
exports.USERNAME_MESSAGE = 'Username must be 3-20 characters: letters, digits, underscore or hyphen.';
exports.RegisterInputSchema = zod_1.z
    .object({
    email: zod_1.z.string().email().max(254).toLowerCase(),
    username: zod_1.z.string().regex(exports.USERNAME_REGEX, exports.USERNAME_MESSAGE),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters.')
        .max(128)
        .regex(/[a-z]/, 'Password must contain a lowercase letter.')
        .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
        .regex(/[0-9]/, 'Password must contain a digit.'),
    countryCode: enums_1.CountryCodeSchema,
    nationality: enums_1.CountryCodeSchema,
    acceptedTerms: zod_1.z.literal(true, {
        errorMap: () => ({ message: 'Terms must be accepted.' }),
    }),
    acceptedPrivacy: zod_1.z.literal(true, {
        errorMap: () => ({ message: 'Privacy policy must be accepted.' }),
    }),
    marketingOptIn: zod_1.z.boolean().default(false),
})
    .strict();
exports.LoginInputSchema = zod_1.z
    .object({
    email: zod_1.z.string().email().max(254).toLowerCase(),
    password: zod_1.z.string().min(1).max(128),
    platformToken: zod_1.z.string().max(2048).optional(),
})
    .strict();
exports.ACCESS_TOKEN_TTL_SECONDS = 900;
exports.REFRESH_TOKEN_TTL_SECONDS = 2_592_000;
exports.TokenPairSchema = zod_1.z.object({
    accessToken: zod_1.z.string(),
    refreshToken: zod_1.z.string(),
    tokenType: zod_1.z.literal('Bearer').default('Bearer'),
    expiresIn: zod_1.z.number().int().positive(),
});
exports.RefreshInputSchema = zod_1.z
    .object({ refreshToken: zod_1.z.string().min(20).max(512) })
    .strict();
exports.LogoutInputSchema = zod_1.z
    .object({ refreshToken: zod_1.z.string().min(20).max(512) })
    .strict();
exports.VerifyAgeInputSchema = zod_1.z
    .object({
    documentType: zod_1.z.enum(['NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE']),
    documentPayload: zod_1.z.string().min(64).max(10_485_760),
})
    .strict();
exports.AgeVerificationStatusSchema = zod_1.z.object({
    verified: zod_1.z.boolean(),
    verifiedAt: zod_1.z.string().datetime({ offset: true }).nullable(),
    birthDateConfirmed: zod_1.z.boolean().default(false),
});
exports.AuthSessionSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    username: zod_1.z.string(),
    role: enums_1.UserRoleSchema,
    countryCode: enums_1.CountryCodeSchema,
    nationality: enums_1.CountryCodeSchema,
    ageVerified: zod_1.z.boolean(),
    bettingHardAllowed: zod_1.z.boolean(),
    accessTokenExpiresAt: zod_1.z.string().datetime({ offset: true }),
});
//# sourceMappingURL=auth.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
const EnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'staging', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().int().positive().default(3000),
    DATABASE_URL: zod_1.z.string().url(),
    REDIS_URL: zod_1.z.string().min(1),
    JWT_ACCESS_SECRET: zod_1.z.string().min(32, 'JWT_ACCESS_SECRET >= 32 chars'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_ACCESS_TTL_SEC: zod_1.z.coerce.number().int().positive().default(900),
    JWT_REFRESH_TTL_SEC: zod_1.z.coerce.number().int().positive().default(2_592_000),
    GAMESERVER_BOOT_TOKEN: zod_1.z.string().min(16),
    GAMESERVER_HMAC_SECRET: zod_1.z.string().min(32),
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    FLUTTERWAVE_SECRET_HASH: zod_1.z.string().optional(),
    GOOGLE_RTDN_AUDIENCE: zod_1.z.string().optional(),
    APPLE_SHARED_SECRET: zod_1.z.string().optional(),
    HUAWEI_PUBLIC_KEY: zod_1.z.string().optional(),
    BETTING_ENABLED: zod_1.z
        .enum(['true', 'false'])
        .default('false')
        .transform((v) => v === 'true'),
    DEPOSITS_ENABLED: zod_1.z
        .enum(['true', 'false'])
        .default('true')
        .transform((v) => v === 'true'),
    MATCHMAKING_PAUSED: zod_1.z
        .enum(['true', 'false'])
        .default('false')
        .transform((v) => v === 'false' ? false : true),
    CORS_ORIGINS: zod_1.z.string().default(''),
});
function validateEnv(raw) {
    const parsed = EnvSchema.safeParse(raw);
    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ');
        throw new Error(`Invalid environment configuration -> ${issues}`);
    }
    return parsed.data;
}
//# sourceMappingURL=env.validation.js.map
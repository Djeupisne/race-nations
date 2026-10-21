/**
 * env.validation — validation stricte de l'environnement au boot (Zod).
 * Une variable manquante/malformée = refus de démarrer (fail-fast), jamais
 * de valeur par défaut silencieuse pour les secrets.
 */
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET >= 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL_SEC: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SEC: z.coerce.number().int().positive().default(2_592_000),

  // Game servers (INV-26)
  GAMESERVER_BOOT_TOKEN: z.string().min(16),
  GAMESERVER_HMAC_SECRET: z.string().min(32),

  // Paiements / webhooks
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  FLUTTERWAVE_SECRET_HASH: z.string().optional(),
  GOOGLE_RTDN_AUDIENCE: z.string().optional(),
  APPLE_SHARED_SECRET: z.string().optional(),
  HUAWEI_PUBLIC_KEY: z.string().optional(),

  // Betting kill-switches (défauts PRUDENTS : désactivé tant que non validé)
  BETTING_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  DEPOSITS_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  MATCHMAKING_PAUSED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'false' ? false : true),

  CORS_ORIGINS: z.string().default(''),
});

export interface AppEnv extends z.infer<typeof EnvSchema> {}

export function validateEnv(raw: Record<string, unknown>): AppEnv {
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    // On n'affiche JAMAIS la valeur des variables, seulement les noms.
    throw new Error(`Invalid environment configuration -> ${issues}`);
  }
  return parsed.data;
}

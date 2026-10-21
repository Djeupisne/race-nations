/**
 * configuration — mapping typé des variables d'environnement validées
 * vers l'objet injectable ConfigService. Aucune lecture de process.env
 * ailleurs dans le code applicatif.
 */
import { validateEnv, type AppEnv } from './env.validation';

export interface AppConfig {
  env: string;
  port: number;
  corsOrigins: string[];
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtlSec: number;
    refreshTtlSec: number;
  };
  gameservers: { bootToken: string; hmacSecret: string };
  betting: { enabled: boolean; depositsEnabled: boolean; matchmakingPaused: boolean };
  providers: {
    stripe: { secretKey?: string; webhookSecret?: string };
    flutterwave: { secretHash?: string };
    google: { rtdnAudience?: string };
    apple: { sharedSecret?: string };
    huawei: { publicKey?: string };
  };
}

export default (): AppConfig => {
  const env: AppEnv = validateEnv(process.env as Record<string, unknown>);
  return {
    env: env.NODE_ENV,
    port: env.PORT,
    corsOrigins: env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessTtlSec: env.JWT_ACCESS_TTL_SEC,
      refreshTtlSec: env.JWT_REFRESH_TTL_SEC,
    },
    gameservers: {
      bootToken: env.GAMESERVER_BOOT_TOKEN,
      hmacSecret: env.GAMESERVER_HMAC_SECRET,
    },
    betting: {
      enabled: env.BETTING_ENABLED,
      depositsEnabled: env.DEPOSITS_ENABLED,
      matchmakingPaused: env.MATCHMAKING_PAUSED,
    },
    providers: {
      stripe: { secretKey: env.STRIPE_SECRET_KEY, webhookSecret: env.STRIPE_WEBHOOK_SECRET },
      flutterwave: { secretHash: env.FLUTTERWAVE_SECRET_HASH },
      google: { rtdnAudience: env.GOOGLE_RTDN_AUDIENCE },
      apple: { sharedSecret: env.APPLE_SHARED_SECRET },
      huawei: { publicKey: env.HUAWEI_PUBLIC_KEY },
    },
  };
};

/**
 * main.ts — bootstrap du backend Race Nations.
 *
 * Points critiques :
 *  - rawBody : Stripe exige le corps BRUT pour vérifier la signature ; on le
 *    capture via json({ verify }) AVANT toute transformation (webhooks).
 *  - Versioning URI /v1 (docs/api-versioning.md) — préfixe global 'api' + v1.
 *  - Graceful shutdown : les workers (matchmaking, fleet-health) doivent
 *    cesser d'allouer avant la fermeture du pool Prisma.
 *  - Helmet/CORS restrictifs ; aucun wildcard en prod.
 */
import { NestFactory } from '@nestjs/core';
import { Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as express from 'express';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    // Le raw body est requis par les verifiers de webhook (Stripe t=,v1=).
    rawBody: true,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('port') ?? 3000;
  const env = config.get<string>('env') ?? 'development';

  app.use(
    json({
      limit: '1mb',
      verify: (req: express.Request & { rawBody?: Buffer }, _res, buf) => {
        // buf = bytes exacts reçus — utilisé par stripe.verifier.
        req.rawBody = buf;
      },
    }),
  );
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  app.use(helmet());
  app.enableCors({
    origin: config.get<string[]>('corsOrigins') ?? [],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
    maxAge: 86_400,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
  logger.log(`Race Nations API ${env} démarré sur :${port} (/api/v1)`);
}

bootstrap().catch((err) => {
  // Échec de boot = crash visible, jamais un demi-démarrage silencieux.
  // eslint-disable-next-line no-console
  console.error('FATAL bootstrap', err);
  process.exit(1);
});

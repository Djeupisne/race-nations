/**
 * health.controller.ts — probes k8s (docs/observability.md §2).
 * - GET /healthz : liveness — le process répond, rien de externe (ne jamais tuer un pod
 *   pour une raison Redis : c'est le readiness qui décide).
 * - GET /readyz  : readiness — Ping Prisma + Ping Redis. Échec → 503 (hors service,
 *   le traffic est drainé, aucun endpoint monétaire n'est exposé pendant l'incident).
 * Public : @Public() — pas de JWT (kubelet).
 */
import { Controller, Get, Inject, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Public } from '../../common/guards/jwt-auth.guard';
import { CLOCK, type Clock } from '../../common/utils/clock';

@Controller()
export class HealthController {
  private startedAtMs = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  @Public()
  @Get('healthz')
  liveness(@Res() res: Response): void {
    res.status(200).json({ status: 'ok', uptimeMs: this.clock.nowMs() - this.startedAtMs });
  }

  @Public()
  @Get('readyz')
  async readiness(@Res() res: Response): Promise<void> {
    const checks: Record<string, boolean> = { db: false, redis: false };
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.db = true;
    } catch {
      checks.db = false;
    }
    checks.redis = await this.redis.ping();

    const healthy = checks.db && checks.redis;
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ready' : 'not_ready',
      checks,
      version: process.env.APP_VERSION ?? 'dev',
    });
  }
}

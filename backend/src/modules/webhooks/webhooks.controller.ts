/**
 * webhooks.controller.ts — endpoints publics SIGNÉS (INV-26) : /api/v1/webhooks/*.
 * Pas de JWT : l'auth est la signature provider vérifiée par le verifier enregistré.
 * Réponse toujours 2xx rapide (le provider retry sinon) ; le résultat métier est dans le corps.
 * rawBody est requis pour les HMAC : main.ts configure json({ verify }) qui le pose.
 */
import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { WebhooksService } from './webhooks.service';
import { Public } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  /** POST /webhooks/stripe — payment_intent.* (Stripe-Signature t=,v1=). */
  @Public()
  @Post('stripe')
  async stripe(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    res.status(200);
    return this.webhooks.ingest('/webhooks/stripe', req);
  }

  /** POST /webhooks/flutterwave — verif-hash. */
  @Public()
  @Post('flutterwave')
  async flutterwave(@Req() req: Request) {
    return this.webhooks.ingest('/webhooks/flutterwave', req);
  }

  /** POST /webhooks/google-play — RTDN Pub/Sub push. */
  @Public()
  @Post('google-play')
  async googlePlay(@Req() req: Request) {
    return this.webhooks.ingest('/webhooks/google-play', req);
  }

  /** POST /webhooks/apple — App Store Server Notifications V2. */
  @Public()
  @Post('apple')
  async apple(@Req() req: Request) {
    return this.webhooks.ingest('/webhooks/apple', req);
  }

  /** POST /webhooks/huawei — HM IAP notifications. */
  @Public()
  @Post('huawei')
  async huawei(@Req() req: Request) {
    return this.webhooks.ingest('/webhooks/huawei', req);
  }

  /** GET /webhooks/recent — supervision back-office (MODERATOR+), jamais exposé aux joueurs. */
  @UseGuards(RolesGuard)
  @Roles('MODERATOR', 'ADMIN')
  @Get('recent')
  async recent(@Query('provider') provider?: string, @Query('limit') limit?: string) {
    return this.webhooks.recent(provider, Number.parseInt(limit ?? '50', 10) || 50);
  }

  /** Utilisé par les tests e2e : renvoie simplement le body reçu (sanity raw pipeline). */
  @Public()
  @Post('_echo')
  async echo(@Body() body: unknown) {
    return { received: body !== undefined && body !== null };
  }
}

/**
 * payments.controller.ts — routes /api/v1/payments (docs/api.md §7).
 * - POST /checkout : mutation monétaire → JwtAuthGuard + OwnershipGuard + IdempotencyGuard
 *   (header obligatoire) + rate-limit fail-closed (money route).
 * - La juridiction est dérivée SERVEUR du profil joueur (countryCode), jamais du client
 *   (anti-contournement des plafonds LCB/FT, INV-20).
 * - Aucun endpoint de "crédit" côté client : seul le webhook signe le SUCCEEDED.
 */
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OwnershipGuard } from '../../common/guards/ownership.guard';
import { IdempotencyGuard } from '../../common/guards/idempotency.guard';
import { RateLimitGuard, rateLimit } from '../../common/guards/rate-limit.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PageRequestSchema } from '@race-nations/api-contracts';
import { NotFoundError, ValidationError } from '../../common/errors/domain-errors';

const CheckoutInputSchema = z
  .object({
    amountCents: z.number().int().positive(),
    currencyCode: z.enum(['EUR', 'NGN', 'MAD', 'GHS', 'KES']).default('EUR'),
    provider: z.enum(['STRIPE', 'FLUTTERWAVE']),
  })
  .strict();
type CheckoutInput = z.infer<typeof CheckoutInputSchema>;

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly prisma: PrismaService,
  ) {}

  /** POST /payments/checkout — { paymentId, checkoutUrl, status }. 4xx enveloppe standard. */
  @Post('checkout')
  @UseGuards(IdempotencyGuard, RateLimitGuard)
  @rateLimit({ bucket: 'money-write', points: 5, durationMs: 60_000, failClosed: true })
  async checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CheckoutInputSchema)) input: CheckoutInput,
    @Req() req: Request & { idempotencyKey?: string },
  ) {
    const player = await this.prisma.player.findUnique({
      where: { id: user.playerId },
      select: { countryCode: true },
    });
    if (!player) throw new NotFoundError('Player', user.playerId);
    const key = req.idempotencyKey;
    if (!key) throw new ValidationError({ field: 'Idempotency-Key', reason: 'Missing after guard.' });
    return this.payments.createCheckout({
      playerId: user.playerId,
      amountCents: input.amountCents,
      currencyCode: input.currencyCode,
      jurisdiction: player.countryCode,
      provider: input.provider,
      idempotencyKey: key,
    });
  }

  /** GET /payments — historique paginé. */
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Query(new ZodValidationPipe(PageRequestSchema)) query: { limit: number; cursor?: string }) {
    return this.payments.listForPlayer(user.playerId, query);
  }

  /** GET /payments/:id — statut d'un paiement DU JOUEUR (OwnershipGuard, INV-28). */
  @Get(':id')
  @UseGuards(OwnershipGuard)
  async status(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.payments.getStatus(user.playerId, id);
  }
}

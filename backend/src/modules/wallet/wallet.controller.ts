/**
 * wallet.controller.ts — routes /api/v1/wallet (docs/api.md §6).
 * - GET balances + GET transactions : lecture pure, JWT requis.
 * - POST purchase : mutation monétaire → IdempotencyGuard OBLIGATOIRE (header
 *   `Idempotency-Key`, INV-04) + OwnershipGuard (INV-28) + rate-limit fail-closed.
 * - Aucun endpoint n'accepte un montant "à créditer" venant du client : les débits
 *   sont calculés serveur-side à partir de refs produits/tickets (anti-injection de prix).
 */
import { Body, Controller, Get, Headers, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OwnershipGuard } from '../../common/guards/ownership.guard';
import { IdempotencyGuard } from '../../common/guards/idempotency.guard';
import { RateLimitGuard, rateLimit } from '../../common/guards/rate-limit.guard';
import { PageRequestSchema } from '@race-nations/api-contracts';
import type { AuthenticatedUser } from '../auth/auth.dto';

/** Achat d'un item boutique / ticket par RÉFÉRENCE serveur (le prix vient du catalogue DB). */
const PurchaseInputSchema = z
  .object({
    itemRef: z.string().min(1).max(64), // ex. "ticket:matchday", "skin:neon-lagos"
    quantity: z.number().int().min(1).max(10).default(1),
  })
  .strict();
type PurchaseInput = z.infer<typeof PurchaseInputSchema>;

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  /** GET /wallet/balances — `{ credits, gems, tokens, hardCents }` entiers (INV-01/02/07). */
  @Get('balances')
  async balances(@CurrentUser() user: AuthenticatedUser) {
    return this.wallet.balances(user.playerId);
  }

  /** GET /wallet/transactions — ledger append-only paginé (INV-06). */
  @Get('transactions')
  async transactions(@CurrentUser() user: AuthenticatedUser, @Query(PageRequestSchema) query: { limit: number; cursor?: string }) {
    return this.wallet.transactions(user.playerId, query);
  }

  /**
   * POST /wallet/purchase — débit SOFT idempotent. Clé client obligatoire (guard) ;
   * la clé ledger finale est dérivée `purchase:<playerKey>:<itemRef>` côté service pour
   * coller à l'UNIQUE DB même si le client rejoue avec une autre clé (protection double achat).
   */
  @Post('purchase')
  @UseGuards(IdempotencyGuard, OwnershipGuard, RateLimitGuard)
  @rateLimit({ bucket: 'wallet.purchase', limit: 30, windowMs: 60_000, failClosed: true })
  async purchase(
    @CurrentUser() user: AuthenticatedUser,
    @Body(PurchaseInputSchema) input: PurchaseInput,
    @Req() req: Request & { idempotencyKey?: string },
  ) {
    const catalogPrice = await this.priceOf(input.itemRef); // lookup catalogue — jamais un prix client
    return this.wallet.purchase(user.playerId, {
      column: catalogPrice.column,
      amount: catalogPrice.amount * input.quantity,
      itemRef: `${input.itemRef}#x${input.quantity}`,
      idempotencyKey: req.idempotencyKey ?? `purchase:${user.playerId}:${req.headers['idempotency-key']}`,
    });
  }

  /** Prix catalogue serveur (phase 2 : table ShopItem ; ici refs stables codées, single source). */
  private async priceOf(itemRef: string): Promise<{ column: 'credits' | 'gems'; amount: number }> {
    switch (itemRef) {
      case 'ticket:tournament': return { column: 'credits', amount: 500 };
      case 'ticket:matchday': return { column: 'credits', amount: 500 };
      case 'ticket:clan-wars': return { column: 'credits', amount: 500 };
      case 'ticket:premium': return { column: 'gems', amount: 10 };
      default:
        throw Object.assign(new Error(`Unknown catalog item: ${itemRef}`), { status: 404 });
    }
  }
}

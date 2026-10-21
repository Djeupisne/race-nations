/**
 * wallet.service.ts — façade applicative du wallet joueur (docs/api.md §6).
 * Toutes les écritures monétaires délèguent à WalletRepository (INV-03) ; ce service
 * n'écrit JAMAIS une colonne de balance lui-même. Rôles :
 *  - balances / ledger paginé en lecture (sorties entières, jamais négatives — INV-02),
 *  - crédit récompenses de course (REWARD, clés dérivées `reward:<matchId>:<playerId>` → idempotent INV-04),
 *  - achat boutique/tickets (PURCHASE via repository, prix entiers serveur-side — jamais le client),
 *  - ajustements admin tracés audit (ADMIN_ADJUSTMENT + AdminAuditLog par l'appelant).
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CLOCK, type Clock } from '../../common/utils/clock';
import { Transactional } from '../../common/decorators/transactional.decorator';
import { NotFoundError, ValidationError } from '../../common/errors/domain-errors';
import { deriveLedgerKey } from '../../common/guards/idempotency.guard';
import { WalletRepository, type CurrencyColumn } from './wallet.repository';

export interface RewardBundle {
  credits: number;
  gems: number;
  xp: number; // hors wallet (colonne Player.xp) — géré par match settlement, pas ici
  tokens: number;
}

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: WalletRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** GET /wallet/balances — `{ credits, gems, tokens, hardCents }` entiers (INV-01/02/07). */
  async balances(playerId: string) {
    const wallet = await this.getWalletOf(playerId);
    return {
      credits: wallet.credits,
      gems: wallet.gems,
      tokens: wallet.tokens,
      hardCents: wallet.hardCents,
    };
  }

  /** GET /wallet/transactions — ledger append-only paginé (INV-06), plus récent d'abord. */
  async transactions(playerId: string, query: { limit: number; cursor?: string }) {
    const wallet = await this.getWalletOf(playerId);
    const rows = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id, ...(query.cursor ? { id: { lt: query.cursor } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      select: {
        id: true, type: true, currencyKind: true, amountSigned: true, balanceAfter: true,
        refType: true, refId: true, reversalOfId: true, createdAt: true,
      },
    });
    const items = rows.slice(0, query.limit);
    return {
      items: items.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
      nextCursor: rows.length > query.limit ? items[items.length - 1]?.id ?? null : null,
    };
  }

  /**
   * Crédit des récompenses d'une course VALIDÉE (INV-25/32) — un appel par (match, joueur).
   * Clé dérivée `reward:<matchId>:<playerId>` : rejouer le settlement ne double-paie jamais (INV-04).
   * Les colonnes SOFT sont créditées séparément (credits puis tokens) — chaque ligne a sa propre clé.
   */
  @Transactional()
  async creditRaceRewards(playerId: string, matchId: string, rewards: RewardBundle): Promise<void> {
    const walletId = await this.repo.getOrCreatePlayerWallet(this.prisma as never, playerId);
    if (rewards.credits > 0) {
      await this.repo.credit(this.prisma as never, {
        walletId,
        column: 'credits',
        amount: rewards.credits,
        type: 'REWARD',
        idempotencyKey: `reward:${matchId}:${playerId}:credits`,
        refType: 'MATCH',
        refId: matchId,
      });
    }
    if (rewards.gems > 0) {
      await this.repo.credit(this.prisma as never, {
        walletId,
        column: 'gems',
        amount: rewards.gems,
        type: 'REWARD',
        idempotencyKey: `reward:${matchId}:${playerId}:gems`,
        refType: 'MATCH',
        refId: matchId,
      });
    }
    if (rewards.tokens > 0) {
      await this.repo.credit(this.prisma as never, {
        walletId,
        column: 'tokens',
        amount: rewards.tokens,
        type: 'REWARD',
        idempotencyKey: `reward:${matchId}:${playerId}:tokens`,
        refType: 'MATCH',
        refId: matchId,
      });
    }
  }

  /**
   * Dépôt HARD crédité par le webhook paiement (webhooks.service) — appelé avec la clé
   * `deposit:<paymentId>` (dérivation INV-04). Transactionnel côté appelant.
   */
  async creditDeposit(tx: Prisma.TransactionClient, playerId: string, amountCents: number, paymentId: string) {
    const walletId = await this.repo.getOrCreatePlayerWallet(tx, playerId);
    return this.repo.credit(tx, {
      walletId,
      column: 'hardCents',
      amount: amountCents,
      type: 'DEPOSIT',
      idempotencyKey: deriveLedgerKey('deposit', paymentId),
      refType: 'PAYMENT',
      refId: paymentId,
    });
  }

  /** Achat SOFT générique (boutique/tickets — api.md §6) : débit PURCHASE idempotent par key client. */
  @Transactional()
  async purchase(playerId: string, params: { column: Extract<CurrencyColumn, 'credits' | 'gems'>; amount: number; itemRef: string; idempotencyKey: string }) {
    assertPositiveInt(params.amount);
    const walletId = await this.repo.getOrCreatePlayerWallet(this.prisma as never, playerId);
    const txRow = await this.repo.debit(this.prisma as never, {
      walletId,
      column: params.column,
      amount: params.amount,
      type: 'PURCHASE',
      idempotencyKey: params.idempotencyKey,
      refType: 'SHOP_ITEM',
      refId: params.itemRef,
    });
    return { transactionId: txRow.id, balanceAfter: txRow.balanceAfter };
  }

  /** Ajustement ADMIN tracé (le contrôleur journalise AdminAuditLog AVANT/AFTER — INV-28/29). */
  @Transactional()
  async adminAdjust(playerId: string, params: { column: CurrencyColumn; deltaSigned: number; reason: string; idempotencyKey: string }) {
    if (!Number.isInteger(params.deltaSigned) || params.deltaSigned === 0) {
      throw new ValidationError({ field: 'deltaSigned', reason: 'Non-zero integer required.' });
    }
    const walletId = await this.repo.getOrCreatePlayerWallet(this.prisma as never, playerId);
    return params.deltaSigned > 0
      ? this.repo.credit(this.prisma as never, {
          walletId,
          column: params.column,
          amount: params.deltaSigned,
          type: 'ADMIN_ADJUSTMENT',
          idempotencyKey: params.idempotencyKey,
          refType: 'ADMIN',
          refId: params.reason.slice(0, 64),
        })
      : this.repo.debit(this.prisma as never, {
          walletId,
          column: params.column,
          amount: -params.deltaSigned,
          type: 'ADMIN_ADJUSTMENT',
          idempotencyKey: params.idempotencyKey,
          refType: 'ADMIN',
          refId: params.reason.slice(0, 64),
        });
  }

  /* --------------------------------- Interne -------------------------------- */

  private async getWalletOf(playerId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { playerId } });
    if (!wallet) throw new NotFoundError('Wallet', playerId);
    return wallet;
  }
}

function assertPositiveInt(n: number): void {
  if (!Number.isInteger(n) || n <= 0) throw new ValidationError({ field: 'amount', reason: 'Positive integer required (INV-01).' });
}

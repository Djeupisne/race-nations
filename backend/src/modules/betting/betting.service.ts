/**
 * betting.service.ts — cycle de vie des marchés & positions (docs/betting.md §3, INV-08..INV-21).
 * Escrow : chaque mise est débitée via wallet.repository (SELECT FOR UPDATE) avec la clé
 * d'idempotence `escrow:<marketId>:<playerId>` (INV-04/INV-15). Deux escrows = transfert
 * joueur→HOUSE dans LA MÊME transaction interactive Prisma : jamais de fond en limbes.
 * Transitions d'état marché/position via state-machines (INV-14) ; le settlement est
 * déclenché par match-settlement (outbox), jamais ici.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { BetMarket, Player } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletRepository, type CurrencyColumn } from '../wallet/wallet.repository';
import { deriveLedgerKey } from '../../common/guards/idempotency.guard';
import { BETTING_CONFIG, type BettingConfig } from '../../config/betting.config';
import { assertBetTransition } from '../../common/state-machines/bet.state-machine';
import { assertBetMarketTransition } from '../../common/state-machines/bet-market.state-machine';
import { BetAlreadySettledError } from '../../common/errors/betting-errors';
import { NotFoundError, ValidationError, ForbiddenAdminError } from '../../common/errors/domain-errors';
import { BetValidatorService } from './bet-validator.service';
import { JurisdictionService } from './jurisdiction.service';
import { BetOddsService } from './bet-odds.service';

export interface CreateMarketParams {
  creator: Player;
  stake: number;
  currency: 'SOFT' | 'HARD';
  trackId: string;
  vehicleId?: string;
  opponentUsername?: string;
}

const COLUMN_FOR_CURRENCY: Record<'SOFT' | 'HARD', CurrencyColumn> = { SOFT: 'credits', HARD: 'hardCents' };

@Injectable()
export class BettingService {
  private readonly logger = new Logger(BettingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletRepository,
    @Inject(BETTING_CONFIG) private readonly config: BettingConfig,
    private readonly validator: BetValidatorService,
    private readonly jurisdictions: JurisdictionService,
    private readonly odds: BetOddsService,
  ) {}

  /** POST /betting/markets — crée un défi public ou privé (mise fixée = future INV-10). */
  async createMarket(params: CreateMarketParams): Promise<BetMarket> {
    await this.validator.validateMarketCreation(params.creator, params.currency, params.stake);

    let opponentId: string | null = null;
    if (params.opponentUsername) {
      const opp = await this.prisma.player.findUnique({ where: { username: params.opponentUsername } });
      if (!opp) throw new NotFoundError('Player', params.opponentUsername);
      if (opp.id === params.creator.id) throw new ForbiddenAdminError({}, 'You cannot challenge yourself.');
      // Le pays de l'opposant doit AUSSI autoriser la devise (sinon défi mort-né → refus immédiat).
      await this.jurisdictions.assertAllowed(opp.countryCode, params.currency);
      opponentId = opp.id;
    }

    return this.prisma.betMarket.create({
      data: {
        creatorId: params.creator.id,
        opponentId,
        currency: params.currency,
        stake: params.stake,
        houseEdgeBps: this.config.constants.HOUSE_EDGE_BPS,
        status: opponentId ? 'CHALLENGED' : 'OPEN',
        public: !opponentId,
        trackId: params.trackId,
        vehicleId: params.vehicleId,
      },
    });
  }

  /**
   * POST /betting/markets/:id/join — escrow ATOMIQUE du rejoignant puis verrouillage si 1v1 complet.
   * En v1 1v1 : créateur escrowe à la création, opposant escrowe au join → marché LOCKED.
   */
  async joinMarket(marketId: string, player: Player): Promise<{ market: BetMarket; bet: Prisma.BetGetPayload<object> }> {
    const { market } = await this.validator.validateJoin(marketId, player);
    const column = COLUMN_FOR_CURRENCY[market.currency];

    const result = await this.prisma.$transaction(async (tx) => {
      // Relecture sous tx pour fermer la fenêtre TOCTOU entre validation et écriture.
      const fresh = await tx.betMarket.findUniqueOrThrow({ where: { id: market.id } });
      if (fresh.status !== 'OPEN' && fresh.status !== 'CHALLENGED') {
        throw new ValidationError({ field: 'status', reason: `Market became ${fresh.status}.` });
      }

      // 1) position PENDING (unique marché+joueur — contrainte DB anti-double-position).
      const bet = await tx.bet.create({
        data: {
          marketId: fresh.id,
          playerId: player.id,
          side: fresh.creatorId === player.id ? 0 : 1,
          stake: fresh.stake,
          status: 'PENDING',
        },
      });

      // 2) ESCROW joueur → HOUSE (INV-15) — SELECT FOR UPDATE + ledger dans la même tx.
      const walletId = await this.wallet.getOrCreatePlayerWallet(tx, player.id);
      const houseWalletId = await this.wallet.getHouseWalletId(tx);
      const escrowKey = deriveLedgerKey('escrow', fresh.id, player.id);
      const escrowTx = await this.wallet
        .debit(tx, {
          walletId,
          column,
          amount: fresh.stake,
          type: 'BET_ESCROW',
          idempotencyKey: escrowKey,
          refType: 'BET_MARKET',
          refId: fresh.id,
        })
        .then((t) => t)
        .catch(async () => {
          // Débit idempotent déjà appliqué (replay HTTP) : relire la ligne existante.
          const existing = await tx.walletTransaction.findUniqueOrThrow({ where: { idempotencyKey: escrowKey } });
          return existing;
        });
      await this.wallet.credit(tx, {
        walletId: houseWalletId,
        column,
        amount: fresh.stake,
        type: 'HOUSE_FEE',
        idempotencyKey: `${escrowKey}:house`,
        refType: 'BET_MARKET',
        refId: fresh.id,
      });

      await tx.bet.update({
        where: { id: bet.id },
        data: { status: 'ESCROWED', escrowTxId: escrowTx.id },
      });
      assertBetTransition('PENDING', 'ESCROWED');

      // 3) Pool & coupelle estimée recalculés (INV-08) + transition marché → LOCKED si complet.
      const poolAgg = await tx.bet.aggregate({
        where: { marketId: fresh.id, status: { in: ['ESCROWED', 'RUNNING'] } },
        _sum: { stake: true },
      });
      const totalPool = poolAgg._sum.stake ?? 0;
      const bothSidesEscrowed = await tx.bet.count({ where: { marketId: fresh.id, status: { in: ['ESCROWED', 'RUNNING'] } } });

      const locked = bothSidesEscrowed >= 2 || (fresh.opponentId !== null && bothSidesEscrowed >= 2);
      const nextStatus = locked ? ('LOCKED' as const) : fresh.status === 'OPEN' ? ('CHALLENGED' as const) : fresh.status;
      if (nextStatus !== fresh.status) assertBetMarketTransition(fresh.status, nextStatus);

      const updated = await tx.betMarket.update({
        where: { id: fresh.id },
        data: {
          totalPool,
          houseCutEstimate: this.odds.recomputeCutEstimate(totalPool, fresh.houseEdgeBps),
          ...(fresh.opponentId === null && !locked ? { opponentId: player.id } : {}),
          status: nextStatus,
        },
      });
      const finalBet = await tx.bet.findUniqueOrThrow({ where: { id: bet.id } });
      return { market: updated, bet: finalBet };
    });

    this.logger.log(`Joined market=${marketId} player=${player.id} stake=${market.stake}`);
    return result;
  }

  /** GET /betting/markets — filtres statut/devise/piste + pagination curseur simple. */
  async listMarkets(query: { status?: string; currency?: string; trackId?: string; limit: number; cursor?: string }) {
    const where: Prisma.BetMarketWhereInput = {};
    if (query.status) where.status = query.status as BetMarket['status'];
    if (query.currency) where.currency = query.currency as BetMarket['currency'];
    if (query.trackId) where.trackId = query.trackId;
    if (query.cursor) where.id = { gt: query.cursor };
    const rows = await this.prisma.betMarket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
    });
    const hasMore = rows.length > query.limit;
    return { items: rows.slice(0, query.limit), nextCursor: hasMore ? rows[query.limit - 1].id : null };
  }

  /** GET /betting/markets/:id — détail + pool courant (délégation à bet-odds). */
  async getMarket(marketId: string) {
    const market = await this.prisma.betMarket.findUnique({
      where: { id: marketId },
      include: { bets: { include: { player: { select: { id: true, username: true, nationality: true, plPoints: true } } } } },
    });
    if (!market) throw new NotFoundError('BetMarket', marketId);
    return market;
  }

  /** GET /betting/me — mes positions actives + réglées récentes. */
  async myBets(playerId: string, statusFilter?: string) {
    const where: Prisma.BetWhereInput = { playerId };
    if (statusFilter) where.status = statusFilter as never;
    return this.prisma.bet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { market: { select: { id: true, status: true, currency: true, trackId: true, totalPool: true } } },
    });
  }

  /** Annulation par le CRÉATEUR seul, marché encore OPEN/CHALLENGED : rembourse l'escrow créateur. */
  async cancelMarket(marketId: string, actor: Player): Promise<BetMarket> {
    const market = await this.prisma.betMarket.findUnique({ where: { id: marketId } });
    if (!market) throw new NotFoundError('BetMarket', marketId);
    if (market.creatorId !== actor.id) throw new ForbiddenAdminError({}, 'Only the creator can cancel.');
    if (market.status !== 'OPEN' && market.status !== 'CHALLENGED') {
      throw new ValidationError({ field: 'status', reason: 'Only an unsettled open market can be cancelled.' });
    }
    // Settlement existant ⇒ annulation interdite (verrou INV-14).
    const settled = await this.prisma.betSettlement.findUnique({ where: { marketId }, select: { id: true } });
    if (settled) throw new BetAlreadySettledError(marketId);

    return this.prisma.$transaction(async (tx) => {
      const column = COLUMN_FOR_CURRENCY[market.currency];
      const bets = await tx.bet.findMany({ where: { marketId, status: 'ESCROWED' } });
      for (const b of bets) {
        const walletId = await this.wallet.getOrCreatePlayerWallet(tx, b.playerId);
        const houseWalletId = await this.wallet.getHouseWalletId(tx);
        const refundKey = deriveLedgerKey('refund', marketId, b.playerId);
        await tx.walletTransaction.findUnique({ where: { idempotencyKey: refundKey } }).then(async (hit) => {
          if (hit) return;
          await this.wallet.debit(tx, {
            walletId: houseWalletId,
            column,
            amount: b.stake,
            type: 'REVERSAL',
            idempotencyKey: `${refundKey}:house`,
            refType: 'BET_MARKET',
            refId: marketId,
          });
          await this.wallet.credit(tx, {
            walletId,
            column,
            amount: b.stake,
            type: 'BET_REFUND',
            idempotencyKey: refundKey,
            refType: 'BET_MARKET',
            refId: marketId,
          });
        });
        assertBetTransition(b.status, 'REFUNDED');
        await tx.bet.update({ where: { id: b.id }, data: { status: 'REFUNDED', result: 'REFUND' } });
      }
      assertBetMarketTransition(market.status, 'CANCELLED');
      return tx.betMarket.update({
        where: { id: marketId },
        data: { status: 'CANCELLED', cancelledAt: new Date(), totalPool: 0 },
      });
    });
  }

  /** Alias lecture cotes pour le controller (garde la surface API stable). */
  oddsOf(marketId: string) {
    return this.odds.oddsForMarket(marketId);
  }
}

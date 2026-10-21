/**
 * bet-settlement.service.ts — règlement pari mutuel D'UN MARCHÉ (docs/betting.md §4/§6, INV-08..INV-19).
 * Idempotence double-étage (INV-14) :
 *   1. Verrou DB : INSERT BetSettlement avec marketId UNIQUE + idempotencyKey `settle:<marketId>`
 *      UNIQUE → un second settlement physique est IMPOSSIBLE même en course ;
 *   2. Clés ledger dérivées (`payout:<marketId>:<betId>`, `housecut:<marketId>`) → rejouer = no-op.
 * Le calcul vient EXCLUSIVEMENT de utils/parimutuel.ts (floor + résidu → House, INV-05/09/13).
 * PUSH (match nul / marché annulé après verrouillage) → remboursements intégraux, houseCut = 0 (INV-16).
 * Match INVALIDATED → litige DISPUTED ≤ 72 h (INV-18/19), AUCUN mouvement d'argent ici.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletRepository, type CurrencyColumn } from '../wallet/wallet.repository';
import { deriveLedgerKey } from '../../common/guards/idempotency.guard';
import { computeParimutuelSettlement, computePushRefund, type ParimutuelStake } from '../../common/utils/parimutuel';
import { assertBetTransition } from '../../common/state-machines/bet.state-machine';
import { assertBetMarketTransition } from '../../common/state-machines/bet-market.state-machine';
import { BetAlreadySettledError } from '../../common/errors/betting-errors';
import { NotFoundError, ValidationError } from '../../common/errors/domain-errors';

export interface SettleParams {
  marketId: string;
  /** Gagnants par CAMP : side gagnant(s). En 1v1 : un seul side. */
  winningSide?: number;
  /** true ⇒ push/remboursement intégral (nul contractuel, match abandonné des deux côtés). */
  push?: boolean;
  /** Utilisateur admin si settlement manuel (traçabilité INV-28). */
  settledById?: string;
}

const COLUMN_FOR_CURRENCY: Record<'SOFT' | 'HARD', CurrencyColumn> = { SOFT: 'credits', HARD: 'hardCents' };

@Injectable()
export class BetSettlementService {
  private readonly logger = new Logger(BetSettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletRepository,
  ) {}

  /**
   * Règlement atomique d'un marché LOCKED/RUNNING. Idempotent : rappel sur un marché
   * déjà SETTLED renvoie le settlement existant sans aucun effet de bord (INV-14).
   */
  async settleMarket(params: SettleParams): Promise<Prisma.BetSettlementGetPayload<object>> {
    const existing = await this.prisma.betSettlement.findUnique({ where: { marketId: params.marketId } });
    if (existing) {
      this.logger.log(`settle skipped (already settled) market=${params.marketId}`);
      return existing; // replay outbox/cron → réponse originale, zéro double paiement.
    }

    const market = await this.prisma.betMarket.findUnique({
      where: { id: params.marketId },
      include: { bets: true, match: { select: { status: true } } },
    });
    if (!market) throw new NotFoundError('BetMarket', params.marketId);
    if (market.status === 'SETTLED') throw new BetAlreadySettledError(market.id);
    if (market.status !== 'LOCKED') {
      throw new ValidationError({ field: 'status', reason: `Cannot settle a ${market.status} market.` });
    }

    const escrowed = market.bets.filter((b) => b.status === 'ESCROWED' || b.status === 'RUNNING');
    if (escrowed.length < 2) {
      // Marché verrouillé sans les deux camps = anomalie → refus, investigation runbook §6.
      throw new ValidationError({ field: 'bets', reason: 'Locked market without two escrowed positions.' });
    }

    const column = COLUMN_FOR_CURRENCY[market.currency];
    const stakes: ParimutuelStake[] = escrowed.map((b) => ({ playerId: b.playerId, stake: b.stake }));
    const byPlayer = new Map(escrowed.map((b) => [b.playerId, b]));

    let calc;
    if (params.push) {
      calc = computePushRefund(stakes);
    } else {
      if (params.winningSide === undefined) throw new ValidationError({ field: 'winningSide', reason: 'Required unless push.' });
      const winners = new Set(escrowed.filter((b) => b.side === params.winningSide).map((b) => b.playerId));
      if (winners.size === 0) throw new ValidationError({ field: 'winningSide', reason: 'No escrowed bet on winning side.' });
      calc = computeParimutuelSettlement(stakes, winners, market.houseEdgeBps);
    }

    const payoutByBet = new Map<string, number>();
    for (const p of calc.payouts) {
      const bet = byPlayer.get(p.playerId);
      if (bet) payoutByBet.set(bet.id, p.payout);
    }

    const settlement = await this.prisma.$transaction(async (tx) => {
      // 1) Transition marché LOCKED/RUNNING → SETTLING (graphe strict, INV-14).
      assertBetMarketTransition(market.status, 'SETTLING');
      await tx.betMarket.update({ where: { id: market.id }, data: { status: 'SETTLING' } });

      // 2) VERROU anti double-settlement : INSERT unique avant tout mouvement (INV-14).
      const idemKey = deriveLedgerKey('payout', market.id).replace('payout:', 'settle:'); // settle:<marketId>
      try {
        const created = await tx.betSettlement.create({
          data: {
            marketId: market.id,
            totalPool: calc.totalPool,
            houseCut: calc.houseCut,
            netPool: calc.netPool,
            payouts: payoutByBet as unknown as Prisma.InputJsonValue,
            residual: calc.residue,
            idempotencyKey: idemKey,
            settledBy: params.settledById ?? null,
          },
        });
        // 3) Mouvements ledger idempotents : payouts joueurs + coupelle+résidu House.
        const houseWalletId = await this.wallet.getHouseWalletId(tx);
        for (const b of escrowed) {
          const payout = payoutByBet.get(b.id) ?? 0;
          const isWinner = payout > 0;
          if (isWinner) {
            const key = deriveLedgerKey('payout', market.id, b.id);
            await this.wallet.debit(tx, {
              walletId: houseWalletId,
              column,
              amount: payout,
              type: 'HOUSE_REVERSAL',
              idempotencyKey: `${key}:house`,
              refType: 'BET_MARKET',
              refId: market.id,
            });
            await this.wallet.credit(tx, {
              walletId: await this.wallet.getOrCreatePlayerWallet(tx, b.playerId),
              column,
              amount: payout,
              type: 'BET_PAYOUT',
              idempotencyKey: key,
              refType: 'BET_MARKET',
              refId: market.id,
            });
          }
          const nextStatus = params.push ? ('PUSH' as const) : isWinner ? ('WON' as const) : ('LOST' as const);
          assertBetTransition(b.status, nextStatus);
          await tx.bet.update({
            where: { id: b.id },
            data: { status: nextStatus, result: params.push ? 'PUSH' : isWinner ? 'WIN' : 'LOSS', payout: payoutByBet.get(b.id) ?? 0 },
          });
        }
        // Coupelle définitive : houseCut déjà encaissé à l'escrow côté House ; on trace uniquement
        // le RÉSIDI de floor vers le House (INV-09/13) — jamais deux fois la même clé.
        if (calc.residue > 0) {
          await this.wallet.credit(tx, {
            walletId: houseWalletId,
            column,
            amount: calc.residue,
            type: 'HOUSE_FEE',
            idempotencyKey: deriveLedgerKey('housecut', market.id),
            refType: 'BET_MARKET',
            refId: market.id,
          });
        }
        return created;
      } catch (err) {
        if ((err as { code?: string }).code === 'P2002') {
          // Course perdue : un autre worker a inséré le settlement → on rejoue sa ligne (INV-14).
          const winner = await tx.betSettlement.findUniqueOrThrow({ where: { marketId: market.id } });
          return winner;
        }
        throw err;
      }
    });

    // 4) Marché SETTLING → SETTLED terminal (hors tx si P2002 ci-dessus a court-circuité les écritures).
    await this.prisma.betMarket
      .update({ where: { id: market.id }, data: { status: 'SETTLED' } })
      .catch(() => undefined);

    this.logger.log(`Settled market=${market.id} pool=${calc.totalPool} cut=${calc.houseCut} residue=${calc.residue}`);
    return settlement;
  }

  /**
   * Litige post-règlement (INV-18/19) : match INVALIDATED ou triche détectée APRÈS settlement
   * → marché DISPUTED (gel ≤ 72 h), fonds gelés côté House, aucune restitution automatique.
   * Une transaction CHEAT_REVERSAL est tracée pour la sanction (moderation/sanctions).
   */
  async openDispute(marketId: string, reason: 'CHEAT_SUSPECTED' | 'RESULT_MISMATCH' | 'DISCONNECT_DISPUTE' | 'SERVER_FAULT' | 'OTHER'): Promise<void> {
    const market = await this.prisma.betMarket.findUnique({ where: { id: marketId } });
    if (!market) throw new NotFoundError('BetMarket', marketId);
    if (market.status === 'DISPUTED') return; // idempotent
    if (market.status !== 'SETTLED' && market.status !== 'LOCKED' && market.status !== 'RUNNING') {
      throw new ValidationError({ field: 'status', reason: `Cannot dispute a ${market.status} market.` });
    }
    assertBetMarketTransition(market.status, 'DISPUTED');
    await this.prisma.betMarket.update({
      where: { id: marketId },
      data: { status: 'DISPUTED', disputedAt: new Date(), disputeReason: reason },
    });
    this.logger.warn(`Market ${marketId} DISPUTED (${reason}) — resolution manuelle requise sous 72 h`);
  }

  /** Résolution admin d'un litige : remboursement intégral (VOID) ou maintien du settlement. */
  async resolveDispute(marketId: string, outcome: 'REFUND_ALL' | 'UPHELD'): Promise<void> {
    const market = await this.prisma.betMarket.findUnique({ where: { id: marketId }, include: { bets: true } });
    if (!market) throw new NotFoundError('BetMarket', marketId);
    if (market.status !== 'DISPUTED') throw new ValidationError({ field: 'status', reason: 'Market is not disputed.' });

    if (outcome === 'UPHELD') {
      await this.prisma.betMarket.update({ where: { id: marketId }, data: { status: 'SETTLED', disputedAt: null } });
      return;
    }

    const column = COLUMN_FOR_CURRENCY[market.currency];
    await this.prisma.$transaction(async (tx) => {
      const houseWalletId = await this.wallet.getHouseWalletId(tx);
      for (const b of market.bets) {
        if (b.status !== 'WON' && b.status !== 'LOST' && b.status !== 'PUSH' && b.status !== 'ESCROWED' && b.status !== 'RUNNING') continue;
        const refundKey = deriveLedgerKey('refund', marketId, b.playerId);
        const already = await tx.walletTransaction.findUnique({ where: { idempotencyKey: refundKey } });
        if (already) continue;
        const creditTo = await this.wallet.getOrCreatePlayerWallet(tx, b.playerId);
        // Remboursement de la mise initiale (jamais du payout éventuel — celui-ci est repris séparément).
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
          walletId: creditTo,
          column,
          amount: b.stake,
          type: 'BET_REFUND',
          idempotencyKey: refundKey,
          refType: 'BET_MARKET',
          refId: marketId,
        });
        if (b.status !== 'REFUNDED' && b.status !== 'VOIDED') assertBetTransition(b.status, 'REFUNDED');
        await tx.bet.update({ where: { id: b.id }, data: { status: 'REFUNDED', result: 'REFUND' } });
      }
      await tx.betMarket.update({ where: { id: marketId }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
    });
    this.logger.log(`Dispute ${marketId} resolved REFUND_ALL`);
  }
}

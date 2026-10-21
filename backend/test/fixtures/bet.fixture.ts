/**
 * bet.fixture.ts — fixtures BetMarket / Bet / BetSettlement pour les E2E.
 * Deux niveaux :
 *  1. Helpers de LECTURE/contrôle (findMarket, betsOf, settlementOf) — utilisés par
 *     betting-settlement.e2e-spec.ts et invariants.e2e-spec.ts.
 *  2. Helpers d'ÉCRITURE directe pour construire des états intermédiaires précis
 *     (marché LOCKED avec escrows déjà posés) sans dépendre du flux HTTP complet.
 * Les écritures respectent les contraintes DB (UNIQUE(marketId) sur BetSettlement = INV-14,
 * UNIQUE(marketId, playerId) sur Bet, montants entiers = INV-01).
 */
import { randomUUID } from 'node:crypto';
import type { BetMarket, Bet, PrismaClient } from '@prisma/client';

/** Track de test partagé — inséré idempotamment (les E2E n'ont pas de seed circuits). */
export const TEST_TRACK_ID = '11111111-1111-4111-8111-111111111111';

export async function ensureTestTrack(prisma: PrismaClient): Promise<string> {
  // Le schéma ne modélise pas de table Track (trackId est un champ libre sur BetMarket/Match),
  // donc l'identifiant canonique suffit ; on garde la fonction pour lisibilité + extension.
  return TEST_TRACK_ID;
}

export interface SeedMarketParams {
  creatorId: string;
  opponentId?: string;
  currency: 'SOFT' | 'HARD';
  stake: number; // unité mineure, entier > 0 (INV-01)
  status?: BetMarket['status'];
  houseEdgeBps?: number;
  matchId?: string;
}

/** Crée un BetMarket brut (sans escrow) — point de départ des scénarios. */
export async function seedMarket(prisma: PrismaClient, p: SeedMarketParams): Promise<BetMarket> {
  if (!Number.isInteger(p.stake) || p.stake <= 0) throw new Error('seedMarket: stake entier > 0 requis (INV-01)');
  return prisma.betMarket.create({
    data: {
      creatorId: p.creatorId,
      opponentId: p.opponentId ?? null,
      currency: p.currency,
      stake: p.stake,
      totalPool: 0,
      houseEdgeBps: p.houseEdgeBps ?? 500,
      status: p.status ?? 'OPEN',
      public: true,
      trackId: await ensureTestTrack(prisma),
      matchId: p.matchId ?? null,
    },
  });
}

/**
 * Construit un marché verrouillé 1v1 entièrement échafaudé :
 * deux Bet ESCROWED side 0/1, escrow débité des wallets via ledger BET_ESCROW,
 * totalPool/houseCutEstimate cohérents (INV-08/15). C'est l'état exact dans lequel
 * BetSettlementService.settleMarket() attend un marché.
 */
export async function seedLockedOneVersusOne(
  prisma: PrismaClient,
  params: { creatorId: string; opponentId: string; creatorWalletId: string; opponentWalletId: string; currency: 'SOFT' | 'HARD'; stake: number },
): Promise<{ market: BetMarket; bets: Bet[] }> {
  const column = params.currency === 'SOFT' ? 'credits' : 'hardCents';
  const kind = params.currency === 'SOFT' ? 'CREDITS' : 'HARD_CENTS';
  const market = await seedMarket(prisma, { ...params, status: 'LOCKED' });

  const bets = await prisma.$transaction(async (tx) => {
    const created: Bet[] = [];
    for (const [side, playerId, walletId] of [
      [0, params.creatorId, params.creatorWalletId],
      [1, params.opponentId, params.opponentWalletId],
    ] as const) {
      const wallet = await tx.wallet.update({
        where: { id: walletId },
        data: { [column]: { decrement: params.stake } },
      });
      if ((wallet as never as Record<string, number>)[column] < 0) throw new Error('fixture: solde négatif (INV-02 violé en test!)');
      const escrowTx = await tx.walletTransaction.create({
        data: {
          walletId,
          type: 'BET_ESCROW',
          currencyKind: kind as never,
          amountSigned: -params.stake,
          balanceAfter: (wallet as never as Record<string, number>)[column],
          idempotencyKey: `fixture:escrow:${market.id}:${playerId}`,
          refType: 'BET_MARKET',
          refId: market.id,
        },
      });
      const bet = await tx.bet.create({
        data: { marketId: market.id, playerId, side, stake: params.stake, status: 'ESCROWED', escrowTxId: escrowTx.id },
      });
      created.push(bet);
    }
    const updated = await tx.betMarket.update({
      where: { id: market.id },
      data: { totalPool: params.stake * 2, houseCutEstimate: Math.floor((params.stake * 2 * 500) / 10_000) },
    });
    void updated;
    return created;
  });

  return { market: await prisma.betMarket.findUniqueOrThrow({ where: { id: market.id } }), bets };
}

/** Lecture : marché + bets + settlement (jointure unique INV-14). */
export async function findMarketFull(prisma: PrismaClient, marketId: string) {
  return prisma.betMarket.findUniqueOrThrow({
    where: { id: marketId },
    include: { bets: true, settlement: true },
  });
}

export async function settlementOf(prisma: PrismaClient, marketId: string) {
  return prisma.betSettlement.findUnique({ where: { marketId } });
}

/** Payouts du settlement sous forme map betId → montant. */
export function payoutsMap(settlement: { payouts: Prisma.JsonValue } | null): Record<string, number> {
  return (settlement?.payouts ?? {}) as Record<string, number>;
}

/** Compte les settlements d'un marché (doit toujours valoir ≤ 1 — INV-14). */
export async function settlementCount(prisma: PrismaClient, marketId: string): Promise<number> {
  return prisma.betSettlement.count({ where: { marketId } });
}

/** Génère une clé d'idempotence unique pour les appels HTTP concurrents des tests. */
export function freshIdemKey(prefix: string): string {
  return `${prefix}:${randomUUID()}`;
}

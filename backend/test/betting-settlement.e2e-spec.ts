/**
 * betting-settlement.e2e-spec.ts — le calcul parimutuel est CORRECT et IDEMPOTENT.
 * Double stratégie :
 *  1. Unit-level : on ré-invocle computeParimutuelSettlement (source unique de vérité du
 *     service) sur des pools connus et on vérifie INV-08/09/16 à l'unité près.
 *  2. E2E : marché LOCKED échafaudé en base → BetSettlementService.settleMarket() via
 *     l'app Nest (DI réelle, Postgres réel) → payouts ledger + House cut exacts, puis
 *     re-settlement → aucun effet de bord (INV-14).
 */
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BetSettlementService } from '../src/modules/betting/bet-settlement.service';
import { computeParimutuelSettlement, computePushRefund } from '../src/common/utils/parimutuel';
import { makePlayer, cleanupPlayers, type FixturePlayer } from './fixtures/player.fixture';
import { seedLockedOneVersusOne, settlementOf, payoutsMap, settlementCount } from './fixtures/bet.fixture';
import { balancesForPlayer, houseBalances, ensureHouseWallet } from './fixtures/wallet.fixture';

describe('Betting settlement E2E — parimutuel correct + idempotent', () => {
  describe('calcul pur (utils/parimutuel — même code que le service)', () => {
    it('1v1 equal stakes, edge 5% : winner reçoit netPool, houseCut exact (INV-08)', () => {
      const r = computeParimutuelSettlement(
        [{ playerId: 'A', stake: 1000 }, { playerId: 'B', stake: 1000 }],
        new Set(['A']),
        500,
      );
      expect(r.totalPool).toBe(2000);
      expect(r.houseCut).toBe(100); // floor(2000*500/10000)
      expect(r.netPool).toBe(1900);
      expect(r.payouts.find((p) => p.playerId === 'A')!.payout).toBe(1900);
      expect(r.payouts.find((p) => p.playerId === 'B')!.payout).toBe(0);
      expect(r.residue).toBe(0);
    });

    it('N players, résidu de floor crédité au House, jamais perdu (INV-05/09)', () => {
      // 3 gagnants sur pool impair : floor laisse un résidu.
      const r = computeParimutuelSettlement(
        [
          { playerId: 'W1', stake: 100 }, { playerId: 'W2', stake: 100 }, { playerId: 'W3', stake: 100 },
          { playerId: 'L1', stake: 33 },
        ],
        new Set(['W1', 'W2', 'W3']),
        500,
      );
      expect(r.totalPool).toBe(333);
      expect(r.houseCut).toBe(16);
      expect(r.netPool).toBe(317);
      const paid = r.payouts.reduce((a, p) => a + p.payout, 0);
      expect(paid + r.residue).toBe(r.netPool); // conservation stricte
      expect(r.residue).toBeGreaterThanOrEqual(0);
    });

    it('push : remboursements intégraux, commission nulle (INV-16)', () => {
      const r = computePushRefund([{ playerId: 'A', stake: 700 }, { playerId: 'B', stake: 700 }]);
      expect(r.houseCut).toBe(0);
      expect(r.totalPaidOut).toBe(1400);
      expect(r.residue).toBe(0);
    });
  });

  describe('E2E avec Postgres de test', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let settlement: BetSettlementService;
    let players: FixturePlayer[] = [];

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
      app = moduleRef.createNestApplication();
      await app.init();
      prisma = app.get(PrismaService);
      settlement = app.get(BetSettlementService);
      await ensureHouseWallet(prisma);
    }, 60_000);

    afterAll(async () => {
      for (const p of players) { /* purge faite par cleanupPlayers */ }
      if (prisma && players.length) await cleanupPlayers(prisma, players);
      if (app) await app.close();
    });

    it('règle un marché 1v1 : payouts exacts, houseCut au wallet HOUSE, ledger tracé', async () => {
      const creator = await makePlayer(prisma, { credits: 5_000 });
      const opponent = await makePlayer(prisma, { credits: 5_000 });
      players = [creator, opponent];

      const { market, bets } = await seedLockedOneVersusOne(prisma, {
        creatorId: creator.playerId, opponentId: opponent.playerId,
        creatorWalletId: creator.walletId, opponentWalletId: opponent.walletId,
        currency: 'SOFT', stake: 1_000,
      });

      const houseBefore = await houseBalances(prisma);
      const s = await settlement.settleMarket({ marketId: market.id, winningSide: bets[0].side });

      // INV-08 : pool 2000, cut 100, net 1900 versé au gagnant.
      expect(s.totalPool).toBe(2_000);
      expect(s.houseCut).toBe(100);
      expect(s.netPool).toBe(1_900);
      const payouts = payoutsMap(s);
      expect(payouts[bets[0].id]).toBe(1_900);
      expect(payouts[bets[1].id]).toBe(0);

      // Ledgers joueurs : escrow -1000, payout +1900 / 0.
      const winBal = await balancesForPlayer(prisma, creator.playerId);
      expect(winBal.credits).toBe(5_000 - 1_000 + 1_900);
      const loseBal = await balancesForPlayer(prisma, opponent.playerId);
      expect(loseBal.credits).toBe(5_000 - 1_000);

      // INV-13 : la commission va EXCLUSIVEMENT au House Wallet.
      const houseAfter = await houseBalances(prisma);
      expect(houseAfter.credits - houseBefore.credits).toBe(s.houseCut + s.residual);

      // Bets terminaux WIN/LOSS (INV-23).
      const finalBets = await prisma.bet.findMany({ where: { marketId: market.id } });
      expect(finalBets.map((b) => b.status).sort()).toEqual(['LOST', 'WON']);
    });

    it('re-settlement du même marché = no-op idempotent (INV-14)', async () => {
      const openMarkets = await prisma.betMarket.findMany({ where: { status: 'SETTLED' }, take: 1 });
      expect(openMarkets.length).toBe(1);
      const marketId = openMarkets[0].id;

      const before = await settlementOf(prisma, marketId);
      const balWinnerBefore = await prisma.wallet.findFirstOrThrow({ where: { player: { username: players[0].username } } });

      const again = await settlement.settleMarket({ marketId, winningSide: 0 }); // replay outbox/cron
      const after = await settlementOf(prisma, marketId);

      expect(again.id).toBe(before!.id);            // même settlement, pas de nouveau rang
      expect(after!.id).toBe(before!.id);
      expect(await settlementCount(prisma, marketId)).toBe(1); // UNIQUE(marketId) tienne
      const balWinnerAfter = await prisma.wallet.findFirstOrThrow({ where: { player: { username: players[0].username } } });
      expect(balWinnerAfter.credits).toBe(balWinnerBefore.credits); // zéro double paiement
    });

    it('settlement manuel admin sans winningSide → push remboursé intégralement (INV-16)', async () => {
      const c = await makePlayer(prisma, { credits: 3_000 });
      const o = await makePlayer(prisma, { credits: 3_000 });
      players = players.concat([c, o]);
      const { market } = await seedLockedOneVersusOne(prisma, {
        creatorId: c.playerId, opponentId: o.playerId,
        creatorWalletId: c.walletId, opponentWalletId: o.walletId,
        currency: 'SOFT', stake: 1_000,
      });
      const s = await settlement.settleMarket({ marketId: market.id, push: true });
      expect(s.houseCut).toBe(0);
      const bc = await balancesForPlayer(prisma, c.playerId);
      const bo = await balancesForPlayer(prisma, o.playerId);
      expect(bc.credits).toBe(3_000); // mise récupérée intégralement
      expect(bo.credits).toBe(3_000);
    });
  });
});

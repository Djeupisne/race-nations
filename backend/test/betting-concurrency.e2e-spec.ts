/**
 * betting-concurrency.e2e-spec.ts — preuve anti double-débit sous requêtes simultanées.
 * Scénario A : N=10 jointures concurrentes d'un même challenger sur un marché OPEN
 *   → exactement UNE position (UNIQUE(marketId,playerId)) et UN seul escrow débité.
 * Scénario B : deux challenges DIFFÉRENTS tirent en parallèle sur le même wallet
 *   solde 1 500 pour deux stakes de 1 000 → au plus UNE acceptation (le second doit
 *   échouer InsufficientFunds), jamais de solde négatif (INV-02, SELECT ... FOR UPDATE).
 * Scénario C : settleMarket() appelé 5x en parallèle sur le même marché verrouillé
 *   → un seul BetSettlement, paiements uniques (verrou UNIQUE + clés ledger dérivées).
 */
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BettingService } from '../src/modules/betting/betting.service';
import { BetSettlementService } from '../src/modules/betting/bet-settlement.service';
import { makePlayer, cleanupPlayers, type FixturePlayer } from './fixtures/player.fixture';
import { seedMarket, seedLockedOneVersusOne, settlementCount } from './fixtures/bet.fixture';
import { ensureHouseWallet } from './fixtures/wallet.fixture';

const TRACK_ID = '11111111-1111-4111-8111-111111111111';

async function settleAll<T>(promises: Array<PromiseLike<T>>): Promise<Array<{ ok: boolean; value?: T; error?: unknown }>> {
  const results = await Promise.allSettled(promises);
  return results.map((r) => (r.status === 'fulfilled' ? { ok: true, value: r.value } : { ok: false, error: r.reason }));
}

describe('Betting concurrency E2E — pas de double-débit', () => {
  jest.setTimeout(120_000);
  let app: INestApplication;
  let prisma: PrismaService;
  let betting: BettingService;
  let settlement: BetSettlementService;
  let players: FixturePlayer[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    betting = app.get(BettingService);
    settlement = app.get(BetSettlementService);
    await ensureHouseWallet(prisma);
  }, 60_000);

  afterAll(async () => {
    if (prisma && players.length) await cleanupPlayers(prisma, players);
    if (app) await app.close();
  });

  it('A — 10 join simultanés du même joueur → 1 bet, 1 escrow', async () => {
    const creator = await makePlayer(prisma, { credits: 10_000 });
    const challenger = await makePlayer(prisma, { credits: 10_000 });
    players = [creator, challenger];

    const market = await seedMarket(prisma, { creatorId: creator.playerId, currency: 'SOFT', stake: 500, status: 'OPEN' });
    // Escrow créateur simulé par la fixture (même forme qu'en flux HTTP).
    await prisma.wallet.update({ where: { id: creator.walletId }, data: { credits: { decrement: 500 } } });
    await prisma.bet.create({
      data: { marketId: market.id, playerId: creator.playerId, side: 0, stake: 500, status: 'ESCROWED' },
    });

    const attempts = await settleAll(
      Array.from({ length: 10 }, () => betting.joinMarket(market.id, { id: challenger.playerId } as never)),
    );

    const successes = attempts.filter((a) => a.ok).length;
    const bets = await prisma.bet.findMany({ where: { marketId: market.id, playerId: challenger.playerId } });
    expect(successes).toBeLessThanOrEqual(1);       // une seule victoire de course autorisée
    expect(bets.length).toBe(1);                     // UNIQUE(marketId, playerId) protège
    const escrows = await prisma.walletTransaction.count({
      where: { walletId: challenger.walletId, type: 'BET_ESCROW' },
    });
    expect(escrows).toBeLessThanOrEqual(1);          // jamais de double débit
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: challenger.walletId } });
    expect(wallet.credits).toBeGreaterThanOrEqual(10_000 - 500); // débit ≤ 1× stake
  });

  it('B — 2 marchés simultanés sur un wallet trop peu garni → max 1 succès, solde >= 0 (INV-02)', async () => {
    const creator = await makePlayer(prisma, { credits: 10_000 });
    const poor = await makePlayer(prisma, { credits: 1_500 }); // < 2 x 1 000
    players = players.concat([creator, poor]);

    const m1 = await seedMarket(prisma, { creatorId: creator.playerId, currency: 'SOFT', stake: 1_000, status: 'OPEN' });
    const m2 = await seedMarket(prisma, { creatorId: creator.playerId, currency: 'SOFT', stake: 1_000, status: 'OPEN' });

    const attempts = await settleAll([
      betting.joinMarket(m1.id, { id: poor.playerId } as never),
      betting.joinMarket(m2.id, { id: poor.playerId } as never),
    ]);
    const ok = attempts.filter((a) => a.ok).length;
    expect(ok).toBeLessThanOrEqual(1); // l'autre doit lever InsufficientFunds

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: poor.walletId } });
    expect(wallet.credits).toBeGreaterThanOrEqual(0); // Jamais négatif — la règle d'or.
    void TRACK_ID;
  });

  it('C — settleMarket() x5 en parallèle → 1 settlement, 1 flux de paiements', async () => {
    const c = await makePlayer(prisma, { credits: 5_000 });
    const o = await makePlayer(prisma, { credits: 5_000 });
    players = players.concat([c, o]);
    const { market } = await seedLockedOneVersusOne(prisma, {
      creatorId: c.playerId, opponentId: o.playerId,
      creatorWalletId: c.walletId, opponentWalletId: o.walletId,
      currency: 'SOFT', stake: 1_000,
    });

    const attempts = await settleAll(
      Array.from({ length: 5 }, () => settlement.settleMarket({ marketId: market.id, winningSide: 0 })),
    );
    // Soit idempotence silencieuse (ok), soit BetAlreadySettled (ko) — les deux sont sûrs ;
    // ce qui ne peut PAS arriver : deux settlements physiques ou deux payouts.
    expect(attempts.length).toBe(5);
    expect(await settlementCount(prisma, market.id)).toBe(1);

    const payoutTxs = await prisma.walletTransaction.count({
      where: { walletId: c.walletId, type: 'BET_PAYOUT' },
    });
    expect(payoutTxs).toBeLessThanOrEqual(1); // zéro double crédit non plus
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: c.walletId } });
    expect(wallet.credits).toBe(5_000 - 1_000 + 1_900); // escrow puis netPool exact, une fois
  });
});

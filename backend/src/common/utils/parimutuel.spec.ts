/**
 * Tests unitaires du settlement parimutuel — INV-05, INV-08..INV-09, INV-16.
 * (Matrice testabilité docs/invariants.md : ligne 08..19 niveau unit.)
 */
import {
  assertConservation,
  computeOneVersusOne,
  computeParimutuelSettlement,
  computePushRefund,
  ParimutuelStake,
} from './parimutuel';

const HOUSE_EDGE_BPS = 500; // contrat betting.config.ts — 5%

describe('computeOneVersusOne (INV-08)', () => {
  it('pool 2000 cr → houseCut 100, netPool 1900 intégralement au gagnant', () => {
    const r = computeOneVersusOne(1000, 1000, 'A', HOUSE_EDGE_BPS);
    expect(r.totalPool).toBe(2000);
    expect(r.houseCut).toBe(100);
    expect(r.netPool).toBe(1900);
    expect(r.payouts.find((p) => p.playerId === 'A')?.payout).toBe(1900);
    expect(r.payouts.find((p) => p.playerId === 'B')?.payout).toBe(0);
    expect(r.residue).toBe(0);
  });

  it('mises impaires acceptées au calcul : payout proportionnel (INV-09)', () => {
    // stakeA=3000 stakeB=1000, A gagne : netPool = 4000 - floor(4000*5%) = 3800 ; A reçoit tout (winningStake=3000)
    const r = computeOneVersusOne(3000, 1000, 'A', HOUSE_EDGE_BPS);
    expect(r.houseCut).toBe(200);
    expect(r.payouts.find((p) => p.playerId === 'A')?.payout).toBe(3800);
  });

  it('conservation exacte à l\'unité près (INV-05)', () => {
    const r = computeOneVersusOne(1000, 1000, 'B', HOUSE_EDGE_BPS);
    expect(() => assertConservation(r, 2000)).not.toThrow();
  });

  it('houseCut plancher : pool 199 → cut 9 (floor(199*500/10000)=9), jamais d\'arrondi supérieur', () => {
    const r = computeOneVersusOne(100, 99, 'A', HOUSE_EDGE_BPS);
    expect(r.houseCut).toBe(9);
    expect(r.netPool).toBe(190);
  });
});

describe('computeParimutuelSettlement — N outcomes (INV-09)', () => {
  const stakes: ParimutuelStake[] = [
    { playerId: 'p1', stake: 700 },
    { playerId: 'p2', stake: 200 },
    { playerId: 'p3', stake: 100 },
  ];

  it('payout_i = floor(stake_i × netPool / winningStake) pour les gagnants, 0 sinon', () => {
    const r = computeParimutuelSettlement(stakes, new Set(['p1', 'p2']), HOUSE_EDGE_BPS);
    // totalPool=1000, houseCut=50, netPool=950, winningStake=900
    expect(r.totalPool).toBe(1000);
    expect(r.houseCut).toBe(50);
    expect(r.netPool).toBe(950);
    expect(r.payouts).toEqual([
      { playerId: 'p1', payout: Math.floor((700 * 950) / 900) }, // 738
      { playerId: 'p2', payout: Math.floor((200 * 950) / 900) }, // 211
      { playerId: 'p3', payout: 0 },
    ]);
    expect(r.totalPaidOut).toBe(738 + 211);
    expect(r.residue).toBe(950 - 949); // 1 crédit → House (INV-09 résidu jamais perdu)
    expect(() => assertConservation(r, 1000)).not.toThrow();
  });

  it('somme des payouts <= netPool et résidu >= 0 (INV-09)', () => {
    const r = computeParimutuelSettlement(stakes, new Set(['p3']), HOUSE_EDGE_BPS);
    expect(r.totalPaidOut).toBeLessThanOrEqual(r.netPool);
    expect(r.residue).toBeGreaterThanOrEqual(0);
    expect(r.payouts.find((p) => p.playerId === 'p3')?.payout).toBe(950);
  });

  it('aucun gagnant (winningStake=0) → payouts nuls, residue=netPool (remboursement géré par le service)', () => {
    const r = computeParimutuelSettlement(stakes, new Set<string>(), HOUSE_EDGE_BPS);
    expect(r.totalPaidOut).toBe(0);
    expect(r.residue).toBe(r.netPool);
  });
});

describe('computePushRefund (INV-16)', () => {
  it('égalité : remboursement intégral des mises, houseCut = 0', () => {
    const stakes = [
      { playerId: 'a', stake: 1000 },
      { playerId: 'b', stake: 1000 },
    ];
    const r = computePushRefund(stakes);
    expect(r.houseCut).toBe(0);
    expect(r.payouts).toEqual([
      { playerId: 'a', payout: 1000 },
      { playerId: 'b', payout: 1000 },
    ]);
    expect(r.residue).toBe(0);
    expect(() => assertConservation(r, 2000)).not.toThrow();
  });
});

describe('INV-01 — entiers uniquement', () => {
  it('tous les montants produits sont des entiers sûrs', () => {
    const r = computeParimutuelSettlement(
      [
        { playerId: 'x', stake: 333 },
        { playerId: 'y', stake: 777 },
      ],
      new Set(['x', 'y']),
      HOUSE_EDGE_BPS,
    );
    for (const v of [r.totalPool, r.houseCut, r.netPool, r.totalPaidOut, r.residue, ...r.payouts.map((p) => p.payout)]) {
      expect(Number.isSafeInteger(v)).toBe(true);
    }
  });
});

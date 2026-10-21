/**
 * parimutuel — calculs de settlement pari mutuel (docs/betting.md §4, INV-08..INV-16).
 * 100% entiers, 100% déterministe, zéro effet de bord : le settlement service applique
 * les mouvements via wallet.repository dans une transaction (INV-30).
 */
import { applyBpsFloor, floorDiv } from './money';

export interface ParimutuelStake {
  playerId: string;
  /** Mise immobilisée en escrow, même devise que le marché (INV-07). */
  stake: number;
}

export interface ParimutuelResult {
  totalPool: number;
  houseCut: number;
  netPool: number;
  /** somme des payouts crédités aux gagnants (<= netPool) */
  totalPaidOut: number;
  /** résidu du plancher, à créditer au House Wallet (INV-05/INV-09) */
  residue: number;
  /** payout par joueur (0 pour les perdants) */
  payouts: Array<{ playerId: string; payout: number }>;
}

/**
 * Formule générale (INV-09) : payout_i = floor(stake_i × netPool / winningStake),
 * houseCut = floor(totalPool × bps / 10000) (INV-08), résidu → House.
 * Cas dégénérés : winningStake = 0 (aucun gagnant) → tout le pool est remboursable
 * (les services décident REFUNDED) ; ici payouts = 0 et residue = netPool non redistribué.
 */
export function computeParimutuelSettlement(
  stakes: readonly ParimutuelStake[],
  winningPlayerIds: ReadonlySet<string>,
  houseEdgeBps: number,
): ParimutuelResult {
  const totalPool = stakes.reduce((acc, s) => acc + s.stake, 0);
  const houseCut = applyBpsFloor(totalPool, houseEdgeBps);
  const netPool = totalPool - houseCut;
  const winningStake = stakes.reduce((acc, s) => (winningPlayerIds.has(s.playerId) ? acc + s.stake : acc), 0);

  const payouts: Array<{ playerId: string; payout: number }> = [];
  let totalPaidOut = 0;
  for (const s of stakes) {
    if (winningPlayerIds.has(s.playerId) && winningStake > 0) {
      const p = floorDiv(s.stake * netPool, winningStake);
      payouts.push({ playerId: s.playerId, payout: p });
      totalPaidOut += p;
    } else {
      payouts.push({ playerId: s.playerId, payout: 0 });
    }
  }
  const residue = netPool - totalPaidOut; // >= 0 par construction du plancher (INV-09)
  return { totalPool, houseCut, netPool, totalPaidOut, residue, payouts };
}

/**
 * Cas contractuel 1v1 (INV-08) : totalPool = stakeA + stakeB, houseCut = 5%,
 * le gagnant reçoit netPool, le perdant 0. Mises égales garanties par INV-10 en amont.
 */
export function computeOneVersusOne(
  stakeA: number,
  stakeB: number,
  winner: 'A' | 'B',
  houseEdgeBps: number,
): ParimutuelResult {
  const stakes: ParimutuelStake[] = [
    { playerId: 'A', stake: stakeA },
    { playerId: 'B', stake: stakeB },
  ];
  return computeParimutuelSettlement(stakes, new Set([winner]), houseEdgeBps);
}

/**
 * Égalité / push (INV-16) : chaque joueur récupère sa mise, houseCut = 0.
 * totalPaidOut = totalPool, residue = 0.
 */
export function computePushRefund(stakes: readonly ParimutuelStake[]): ParimutuelResult {
  const totalPool = stakes.reduce((acc, s) => acc + s.stake, 0);
  return {
    totalPool,
    houseCut: 0,
    netPool: totalPool,
    totalPaidOut: totalPool,
    residue: 0,
    payouts: stakes.map((s) => ({ playerId: s.playerId, payout: s.stake })),
  };
}

/** Invariant de conservation vérifiable en test (INV-05) : débits == crédits + houseCut+residue. */
export function assertConservation(result: ParimutuelResult, expectedDebits: number): void {
  const credits = result.totalPaidOut + result.houseCut + result.residue;
  if (credits !== expectedDebits || result.totalPool !== expectedDebits) {
    throw new Error(
      `INV-05 conservation violated: pool=${result.totalPool}, debits=${expectedDebits}, credits=${credits}`,
    );
  }
}

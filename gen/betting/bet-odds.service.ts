/**
 * bet-odds.service.ts — cotes implicites du pool (docs/betting.md §5, GET /markets/:id/odds).
 * Le pari mutuel n'a PAS de cote fixe : la cote affichée est une ESTIMATION dérivée du
 * pool courant (INV-08) et bouge à chaque escrow. Calculs 100 % entiers/floor (INV-01) :
 *   impliedOdds_i = netPool / stake_i (float d'AFFICHAGE uniquement),
 *   payoutEstimate_i = floor(stake_i × netPool / stake_i_side) (INV-09, entier contractuel).
 * Marché sans opposant encore → les deux côtés renvoyés avec leur part théorique.
 */
import { Injectable } from '@nestjs/common';
import type { BetMarket } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { applyBpsFloor, floorDiv } from '../../common/utils/money';
import { NotFoundError } from '../../common/errors/domain-errors';

export interface OddsSideView {
  side: number;
  /** Mises accumulées sur ce camp (escrows effectifs, ledger-vérifiés). */
  stakedTotal: number;
  /** Joueur(s) engagé(s) côté (id + pseudo pour l'UI). */
  players: Array<{ playerId: string; username: string; stake: number }>;
  /** Estimation du payout total du camp si ses joueurs gagnent (floor, INV-09). */
  payoutEstimate: number;
  /** Cote implicite décimale d'affichage (>= 1 ; null si camp vide). */
  impliedDecimalOdds: number | null;
}

export interface MarketOddsView {
  marketId: string;
  status: BetMarket['status'];
  currency: BetMarket['currency'];
  totalPool: number;
  houseCutEstimate: number;
  netPool: number;
  sides: OddsSideView[];
}

@Injectable()
export class BetOddsService {
  constructor(private readonly prisma: PrismaService) {}

  async oddsForMarket(marketId: string): Promise<MarketOddsView> {
    const market = await this.prisma.betMarket.findUnique({
      where: { id: marketId },
      include: { bets: { include: { player: { select: { id: true, username: true } } } } },
    });
    if (!market) throw new NotFoundError('BetMarket', marketId);

    // Pool effectif = somme des escrows ACCEPTED/ESCROWED/RUNNING (les PENDING ne comptent pas).
    const counted = market.bets.filter((b) => ['ACCEPTED', 'ESCROWED', 'RUNNING', 'WON', 'LOST', 'PUSH'].includes(b.status));
    const totalPool = counted.reduce((acc, b) => acc + b.stake, 0);
    const houseCut = applyBpsFloor(totalPool, market.houseEdgeBps);
    const netPool = totalPool - houseCut;

    const sidesMap = new Map<number, { staked: number; players: OddsSideView['players'] }>();
    for (const b of counted) {
      const entry = sidesMap.get(b.side) ?? { staked: 0, players: [] };
      entry.staked += b.stake;
      entry.players.push({ playerId: b.playerId, username: b.player.username, stake: b.stake });
      sidesMap.set(b.side, entry);
    }

    const sides: OddsSideView[] = [0, 1].map((side) => {
      const info = sidesMap.get(side) ?? { staked: 0, players: [] as OddsSideView['players'] };
      const payoutEstimate = info.staked > 0 && netPool > 0 ? floorDiv(info.staked * netPool, info.staked) : 0;
      // Cote implicite : netPool / stake du camp (plus le camp est gros, moins la cote est belle).
      const implied = info.staked > 0 ? Math.round((netPool / info.staked) * 100) / 100 : null;
      return {
        side,
        stakedTotal: info.staked,
        players: info.players,
        payoutEstimate: info.staked > 0 ? netPool : 0, // en mutuel 1v1, le camp vainqueur se partage netPool
        impliedDecimalOdds: implied,
      };
    });

    return {
      marketId: market.id,
      status: market.status,
      currency: market.currency,
      totalPool,
      houseCutEstimate: houseCut,
      netPool,
      sides,
      // payoutEstimate ci-dessus volontairement simple : un seul joueur par camp en v1 1v1.
    } as MarketOddsView;
  }

  /** Recalcule et persiste houseCutEstimate à chaque escrow (appelé par betting.service). */
  recomputeCutEstimate(totalPool: number, houseEdgeBps: number): number {
    return applyBpsFloor(totalPool, houseEdgeBps);
  }
}

/**
 * Race Nations — Contrats Betting (docs/api.md §5, docs/betting.md).
 * Pari mutuel 1v1, commission houseEdgeBps = 500 (5 %). Miroir des modèles
 * Prisma `BetMarket`, `Bet`, `BetSettlement` et des machines d'états
 * backend/src/common/state-machines/bet.state-machine.ts / bet-market.state-machine.ts.
 *
 * Règles contractuelles :
 *  - Toute valeur monétaire est un ENTIER (INV-01) : crédits pour SOFT, CENTIMES pour HARD.
 *  - SOFT et HARD ne se mélangent jamais dans un règlement (INV-07).
 *  - Bornes de mise (INV-11) : SOFT 10–10 000 cr ; HARD 100–10 000 ct ; tournoi 50–50 000 cr.
 *  - Mises identiques obligatoires sur un défi 1v1 (INV-10) — vérifié SERVEUR.
 */
import { z } from 'zod';
import {
  BetMarketStatusSchema,
  BetResultSchema,
  BetStatusSchema,
  CurrencySchema,
  DisputeReasonSchema,
} from './enums';

/* ------------------------------ Constantes ------------------------------- */

/** Bornes INV-11 — doublon défensif des BETTING_CONSTANTS backend (le serveur garde la main). */
export const BET_BOUNDS = {
  SOFT_MIN: 10,
  SOFT_MAX: 10_000,
  HARD_MIN_CENTS: 100,
  HARD_MAX_CENTS: 10_000,
  TOURNAMENT_MIN: 50,
  TOURNAMENT_MAX: 50_000,
  HOUSE_EDGE_BPS: 500,
} as const;

/* -------------------------------- Inputs --------------------------------- */

/** POST /betting/markets — créer un défi 1v1. La devise dérive les bornes côté serveur. */
export const CreateMarketInputSchema = z
  .object({
    stake: z.number().int().positive(), // bornes par devise vérifiées serveur (INV-11 → BET_STAKE_OUT_OF_RANGE)
    currency: CurrencySchema,
    trackId: z.string().min(1).max(64),
    vehicleId: z.string().min(1).max(64).optional(),
    /** Visibilité publique du marché (défi direct à un joueur via opponentId en privé). */
    opponentUsername: z.string().min(3).max(20).optional(),
  })
  .strict();
export type CreateMarketInput = z.infer<typeof CreateMarketInputSchema>;

/**
 * POST /betting/markets/:id/challenge — accepter un défi.
 * `stake` DOIT être strictement égal au stake du marché (INV-10) — sinon
 * 422 BET_STAKE_MISMATCH. Clé d'idempotence obligatoire en header (INV-04).
 */
export const AcceptChallengeInputSchema = z
  .object({
    stake: z.number().int().positive(),
  })
  .strict();
export type AcceptChallengeInput = z.infer<typeof AcceptChallengeInputSchema>;

/** POST /betting/markets/:id/dispute — litige : gel ≤ 72 h (INV-19). */
export const OpenDisputeInputSchema = z
  .object({
    reason: DisputeReasonSchema,
    note: z.string().max(2_000).optional(),
  })
  .strict();
export type OpenDisputeInput = z.infer<typeof OpenDisputeInputSchema>;

/** POST /betting/admin/markets/:id/settle — settlement manuel ADMIN (INV-28), idempotent (INV-14). */
export const ManualSettleInputSchema = z
  .object({
    /** BetIds du camp gagnant ; tableau VIDE = égalité → push intégral sans commission (INV-16). */
    winningBetIds: z.array(z.string().uuid()).max(8),
    /** true si fraude confirmée côté gagnant → remboursement perdant + reverse houseCut (INV-18). */
    cheatReversal: z.boolean().default(false),
    reason: z.string().min(3).max(500),
  })
  .strict();
export type ManualSettleInput = z.infer<typeof ManualSettleInputSchema>;

/** GET /betting/markets — filtres de liste. */
export const ListMarketsQuerySchema = z
  .object({
    currency: CurrencySchema.optional(),
    trackId: z.string().max(64).optional(),
    status: BetMarketStatusSchema.optional(),
    minStake: z.number().int().nonnegative().optional(),
    maxStake: z.number().int().positive().optional(),
    limit: z.number().int().min(1).max(100).default(20),
    cursor: z.string().optional(),
  })
  .strict();
export type ListMarketsQuery = z.infer<typeof ListMarketsQuerySchema>;

/* -------------------------------- Outputs -------------------------------- */

/** Position d'un joueur sur un marché (vue API de `Bet`). */
export const BetDtoSchema = z.object({
  id: z.string().uuid(),
  marketId: z.string().uuid(),
  playerId: z.string().uuid(),
  username: z.string(),
  side: z.number().int().min(0).max(7),
  stake: z.number().int().positive(),
  status: BetStatusSchema,
  result: BetResultSchema.nullable(),
  payout: z.number().int().nonnegative(), // floor(stake × netPool / winningStake) (INV-09)
  escrowTxId: z.string().uuid().nullable(), // lien ledger BET_ESCROW (INV-15)
  createdAt: z.string().datetime({ offset: true }),
});
export type BetDto = z.infer<typeof BetDtoSchema>;

/** Pool économique courant d'un marché — entiers uniquement (INV-01). */
export const MarketPoolSchema = z.object({
  totalPool: z.number().int().nonnegative(),
  houseCutEstimate: z.number().int().nonnegative(), // floor(totalPool × bps / 10000) (INV-08)
  netPool: z.number().int().nonnegative(),
});
export type MarketPool = z.infer<typeof MarketPoolSchema>;

/** Marché complet (GET /betting/markets/:id). */
export const BetMarketDtoSchema = z.object({
  id: z.string().uuid(),
  creatorId: z.string().uuid(),
  opponentId: z.string().uuid().nullable(),
  matchId: z.string().uuid().nullable(),
  tournamentRef: z.string().nullable(),
  currency: CurrencySchema,
  stake: z.number().int().positive(),
  status: BetMarketStatusSchema,
  public: z.boolean(),
  trackId: z.string(),
  vehicleId: z.string().nullable(),
  houseEdgeBps: z.number().int().min(0).max(1_000),
  pool: MarketPoolSchema,
  disputedAt: z.string().datetime({ offset: true }).nullable(),
  disputeReason: DisputeReasonSchema.nullable(),
  bets: z.array(BetDtoSchema),
  settledAt: z.string().datetime({ offset: true }).nullable(),
  createdAt: z.string().datetime({ offset: true }),
});
export type BetMarketDto = z.infer<typeof BetMarketDtoSchema>;

/** GET /betting/markets/:id/odds — cotes implicites live recalculées à chaque engagement (INV-09). */
export const MarketOddsSideSchema = z.object({
  side: z.number().int().min(0).max(7),
  wageredTotal: z.number().int().nonnegative(),
  players: z.number().int().nonnegative(),
  /** payout unitaire estimé = floor(netPool / wageredTotal) si un joueur gagne avec 1 unité… exposé en multiple plancher */
  impliedPayoutMultiplierFloor: z.number().int().nonnegative(),
});
export const MarketOddsDtoSchema = z.object({
  marketId: z.string().uuid(),
  pool: MarketPoolSchema,
  sides: z.array(MarketOddsSideSchema),
  computedAt: z.string().datetime({ offset: true }), // Clock.now() (INV-29)
});
export type MarketOddsDto = z.infer<typeof MarketOddsDtoSchema>;

/** Vue GET /betting/bets/me — historique paginé. */
export const MyBetSchema = z.object({
  bet: BetDtoSchema,
  market: z.object({
    id: z.string().uuid(),
    status: BetMarketStatusSchema,
    currency: CurrencySchema,
    trackId: z.string(),
  }),
});
export type MyBet = z.infer<typeof MyBetSchema>;

/** Settlement exposé (auditabilité — miroir BetSettlement, INV-14). */
export const BetSettlementDtoSchema = z.object({
  marketId: z.string().uuid(),
  totalPool: z.number().int().nonnegative(),
  houseCut: z.number().int().nonnegative(), // 0 si push (INV-16)
  netPool: z.number().int().nonnegative(),
  payouts: z.record(z.string().uuid(), z.number().int().nonnegative()),
  residual: z.number().int().nonnegative(), // résidu de floor crédité House (INV-09/13)
  settledBy: z.string().nullable(), // userId admin si manuel (INV-28)
  settledAt: z.string().datetime({ offset: true }),
});
export type BetSettlementDto = z.infer<typeof BetSettlementDtoSchema>;

/* --------------------------- House Wallet (admin) ------------------------ */

/** GET /house/balance (ADMIN only, INV-28). */
export const HouseBalanceDtoSchema = z.object({
  balanceCents: z.number().int().nonnegative(),
  escrowOutstanding: z.number().int().nonnegative(), // mises engagées non encore réglées
  cumulativeFees: z.number().int().nonnegative(),
  pnlToday: z.number().int(), // signé : fees jour − reversals jour
});
export type HouseBalanceDto = z.infer<typeof HouseBalanceDtoSchema>;

/** POST /house/reverse — contre-écriture d'un settlement litigieux (INV-06 : jamais d'UPDATE). */
export const HouseReverseInputSchema = z
  .object({
    marketId: z.string().uuid(),
    reason: z.string().min(3).max(500),
  })
  .strict();
export type HouseReverseInput = z.infer<typeof HouseReverseInputSchema>;

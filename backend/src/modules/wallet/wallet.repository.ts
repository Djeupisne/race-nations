/**
 * wallet.repository.ts — LA SEULE porte d'entrée des mouvements d'argent (INV-03).
 * Aucun service ne touche les colonnes monétaires directement : tout débit/crédit passe ici.
 *
 * Protocole d'un mouvement (obligatoire, dans une transaction interactive Prisma) :
 *   1. `SELECT … FOR UPDATE` sur la ligne du wallet → verrou pessimiste de rangée ;
 *   2. contrôle solde ≥ montant débité sinon rollback + InsufficientFundsError (INV-02) ;
 *   3. UPDATE de la colonne concernée UNIQUEMENT (credits|gems|tokens|hardCents) —
 *      jamais de mélange SOFT/HARD dans un même règlement (INV-07) ;
 *   4. INSERT append-only d'une WalletTransaction (amountSigned, balanceAfter,
 *      idempotencyKey UNIQUE — INV-04/INV-06).
 *
 * Idempotence : si `idempotencyKey` existe déjà → RETOUR DE LA LIGNE EXISTANTE sans
 * nouveau mouvement (rejouer = réponse originale, INV-04). La contrainte DB reste le
 * dernier rempart contre la race (P2002 → relecture).
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InsufficientFundsError, NotFoundError, ServerUnavailableError } from '../../common/errors/domain-errors';

/** Devise ciblée par un mouvement — mapping exact colonnes Wallet (INV-07). */
export type CurrencyColumn = 'credits' | 'gems' | 'tokens' | 'hardCents';

const WALLET_COLUMNS: ReadonlySet<CurrencyColumn> = new Set(['credits', 'gems', 'tokens', 'hardCents']);

export interface LedgerEntry {
  id: string;
  walletId: string;
  type: Prisma.EnumWalletTransactionTypeFilter['equals'] extends never ? string : string;
  currencyKind: CurrencyColumn extends infer _ ? string : string;
  amountSigned: number;
  balanceAfter: number;
  idempotencyKey: string;
}

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Verrou de rangée SELECT … FOR UPDATE (à l'intérieur d'une tx interactive). */
  private async lockWallet(tx: Prisma.TransactionClient, walletId: string): Promise<{ id: string; credits: number; gems: number; tokens: number; hardCents: number }> {
    const rows = await tx.$queryRaw<Array<{ id: string; credits: number; gems: number; tokens: number; hardCents: number }>>`
      SELECT id, credits, gems, tokens, "hardCents"
      FROM wallets
      WHERE id = ${walletId}::uuid
      FOR UPDATE
    `;
    const wallet = rows[0];
    if (!wallet) throw new NotFoundError('Wallet', walletId);
    return wallet;
  }

  /** Lecture idempotencyKey AVANT toute écriture — rejouer renvoie la ligne d'origine (INV-04). */
  async findTxByIdempotencyKey(idempotencyKey: string) {
    return this.prisma.walletTransaction.findUnique({ where: { idempotencyKey } });
  }

  /**
   * DÉBIT atomique : lock → contrôle solde → UPDATE -= amount → ledger (amountSigned < 0).
   * `tx` DOIT être un client transactionnel (le @Transactional des services le fournit).
   */
  async debit(
    tx: Prisma.TransactionClient,
    params: {
      walletId: string;
      column: CurrencyColumn;
      amount: number; // entier strictement positif (INV-01)
      type: 'PURCHASE' | 'BET_ESCROW' | 'REVERSAL' | 'HOUSE_REVERSAL' | 'ADMIN_ADJUSTMENT';
      idempotencyKey: string;
      refType?: string;
      refId?: string;
    },
  ) {
    assertAmount(params.amount);
    assertColumn(params.column);

    const existing = await tx.walletTransaction.findUnique({ where: { idempotencyKey: params.idempotencyKey } });
    if (existing) return existing; // replay → ligne originale, aucun second mouvement (INV-04)

    const wallet = await this.lockWallet(tx, params.walletId);
    const before = wallet[params.column];
    if (before < params.amount) {
      // Rollback implicite : l'appelant sort de la tx par l'exception → aucune écriture partielle.
      throw new InsufficientFundsError(params.column === 'hardCents' ? 'HARD' : 'SOFT', params.amount, before);
    }
    const after = before - params.amount;
    await tx.wallet.update({ where: { id: params.walletId }, data: { [params.column]: after } });
    return this.appendTx(tx, {
      walletId: params.walletId,
      type: params.type,
      currencyKind: currencyKindOf(params.column),
      amountSigned: -params.amount,
      balanceAfter: after,
      idempotencyKey: params.idempotencyKey,
      refType: params.refType,
      refId: params.refId,
    });
  }

  /** CRÉDIT atomique : lock → UPDATE += amount → ledger (amountSigned > 0). */
  async credit(
    tx: Prisma.TransactionClient,
    params: {
      walletId: string;
      column: CurrencyColumn;
      amount: number;
      type: 'DEPOSIT' | 'REWARD' | 'BET_PAYOUT' | 'BET_REFUND' | 'HOUSE_FEE' | 'HOUSE_REVERSAL' | 'REVERSAL' | 'ADMIN_ADJUSTMENT';
      idempotencyKey: string;
      refType?: string;
      refId?: string;
      reversalOfId?: string;
    },
  ) {
    assertAmount(params.amount);
    assertColumn(params.column);

    const existing = await tx.walletTransaction.findUnique({ where: { idempotencyKey: params.idempotencyKey } });
    if (existing) return existing;

    const wallet = await this.lockWallet(tx, params.walletId);
    const after = wallet[params.column] + params.amount; // pas de plafond max en dur ; overflow Number sûr (< 2^53, INV-01)
    await tx.wallet.update({ where: { id: params.walletId }, data: { [params.column]: after } });
    return this.appendTx(tx, {
      walletId: params.walletId,
      type: params.type,
      currencyKind: currencyKindOf(params.column),
      amountSigned: params.amount,
      balanceAfter: after,
      idempotencyKey: params.idempotencyKey,
      refType: params.refType,
      refId: params.refId,
      reversalOfId: params.reversalOfId,
    });
  }

  /**
   * Transfert entre deux wallets (escrow joueur→house, payout house→joueur…) :
   * déverrouille TOUJOURS dans le même ordre global (walletId trié) pour éviter les interblocages.
   */
  async transfer(
    tx: Prisma.TransactionClient,
    params: {
      fromWalletId: string;
      toWalletId: string;
      column: CurrencyColumn;
      amount: number;
      debitType: 'BET_ESCROW' | 'PURCHASE' | 'HOUSE_REVERSAL';
      creditType: 'BET_PAYOUT' | 'BET_REFUND' | 'HOUSE_FEE' | 'DEPOSIT';
      debitKey: string;
      creditKey: string;
      refType?: string;
      refId?: string;
    },
  ): Promise<void> {
    const [first, second] = params.fromWalletId < params.toWalletId
      ? [params.fromWalletId, params.toWalletId]
      : [params.toWalletId, params.fromWalletId];
    // verrouille les deux lignes dans l'ordre canonique avant toute écriture
    await this.lockWallet(tx, first);
    await this.lockWallet(tx, second);
    await this.debit(tx, {
      walletId: params.fromWalletId,
      column: params.column,
      amount: params.amount,
      type: params.debitType,
      idempotencyKey: params.debitKey,
      refType: params.refType,
      refId: params.refId,
    });
    await this.credit(tx, {
      walletId: params.toWalletId,
      column: params.column,
      amount: params.amount,
      type: params.creditType,
      idempotencyKey: params.creditKey,
      refType: params.refType,
      refId: params.refId,
    });
  }

  /** Snapshot lecture simple (GET /wallet/balances) — hors tx, tolère la lecture non verrouillée. */
  async getBalances(walletId: string) {
    const w = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      select: { id: true, credits: true, gems: true, tokens: true, hardCents: true },
    });
    if (!w) throw new NotFoundError('Wallet', walletId);
    return w;
  }

  /** Wallet HOUSE unique (ownerType=HOUSE) — seed migration 0006_house_wallet. */
  async getHouseWalletId(tx?: Prisma.TransactionClient): Promise<string> {
    const client = tx ?? this.prisma;
    const house = await client.wallet.findFirst({ where: { ownerType: 'HOUSE' }, select: { id: true } });
    if (!house) {
      // Absence = déploiement incomplet (seed manquant) → incident, pas un comportement dégradé.
      throw new ServerUnavailableError('House wallet missing (run 0006_house_wallet seed).');
    }
    return house.id;
  }

  /** Wallet d'un joueur (peut être créé à la volée si absent — sécurité post-migration). */
  async getOrCreatePlayerWallet(tx: Prisma.TransactionClient, playerId: string): Promise<string> {
    const existing = await tx.wallet.findUnique({ where: { playerId }, select: { id: true } });
    if (existing) return existing.id;
    const created = await tx.wallet.create({ data: { playerId, ownerType: 'PLAYER' }, select: { id: true } });
    return created.id;
  }

  /* ------------------------------- Interne -------------------------------- */

  private appendTx(tx: Prisma.TransactionClient, data: {
    walletId: string;
    type: string;
    currencyKind: string;
    amountSigned: number;
    balanceAfter: number;
    idempotencyKey: string;
    refType?: string;
    refId?: string;
    reversalOfId?: string;
  }) {
    return tx.walletTransaction.create({
      data: {
        walletId: data.walletId,
        type: data.type as Prisma.WalletTransactionCreateInput['type'],
        currencyKind: data.currencyKind as Prisma.WalletTransactionCreateInput['currencyKind'],
        amountSigned: data.amountSigned,
        balanceAfter: data.balanceAfter,
        idempotencyKey: data.idempotencyKey,
        refType: data.refType,
        refId: data.refId,
        reversalOfId: data.reversalOfId,
      },
    }).catch((err: unknown) => {
      // Course sur la même clé entre le findUnique et le create : P2002 → relire la gagnante.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return tx.walletTransaction.findUniqueOrThrow({ where: { idempotencyKey: data.idempotencyKey } });
      }
      throw err;
    });
  }
}

function assertAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    // INV-01 : les montants sont des entiers STRICTEMENT positifs passés au repository.
    throw new TypeError(`Wallet amount must be a positive integer, got ${String(amount)}`);
  }
}
function assertColumn(column: CurrencyColumn): void {
  if (!WALLET_COLUMNS.has(column)) throw new TypeError(`Unknown wallet column: ${String(column)}`);
}
function currencyKindOf(column: CurrencyColumn): 'CREDITS' | 'GEMS' | 'TOKENS' | 'HARD_CENTS' {
  switch (column) {
    case 'credits': return 'CREDITS';
    case 'gems': return 'GEMS';
    case 'tokens': return 'TOKENS';
    case 'hardCents': return 'HARD_CENTS';
  }
}

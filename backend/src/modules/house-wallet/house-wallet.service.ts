/**
 * house-wallet.service.ts — wallet HOUSE (ownerType=HOUSE, seed 0006_house_wallet).
 * Le House reçoit : houseCut de chaque settlement (INV-13), résidus de floor parimutuel
 * (INV-09), et rembourse les payouts (INV-12 : jamais de découvert House).
 * Lecture supervision ADMIN/MODERATOR ; contre-écritures (reversals) ADMIN uniquement,
 * toujours append-only via WalletRepository (INV-03/INV-06) + AdminAuditLog (INV-28).
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletRepository, type CurrencyColumn } from '../wallet/wallet.repository';
import { NotFoundError, ValidationError } from '../../common/errors/domain-errors';

@Injectable()
export class HouseWalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletRepository,
  ) {}

  /** Snapshot courant : solde HARD, escrow sortant (bets ESCROWED/RUNNING non réglés), frais cumulés. */
  async getSnapshot() {
    const houseWalletId = await this.wallet.getHouseWalletId();
    const balances = await this.wallet.getBalances(houseWalletId);

    const escrowOutstanding = await this.prisma.bet.aggregate({
      _sum: { stake: true },
      where: { status: { in: ['ESCROWED', 'RUNNING'] }, market: { currency: 'HARD' } },
    });

    const feesAgg = await this.prisma.betSettlement.aggregate({
      _sum: { houseCut: true, residual: true },
    });

    return {
      hardCents: balances.hardCents,
      escrowOutstandingCents: escrowOutstanding._sum.stake ?? 0,
      cumulativeFeesCents: (feesAgg._sum.houseCut ?? 0) + (feesAgg._sum.residual ?? 0),
      liabilitiesCents: (escrowOutstanding._sum.stake ?? 0) - ((feesAgg._sum.houseCut ?? 0) + (feesAgg._sum.residual ?? 0)),
    };
  }

  /** Historique du ledger House (append-only) — pagination simple par curseur date. */
  async listTransactions(params: { limit?: number; before?: Date }) {
    const houseWalletId = await this.wallet.getHouseWalletId();
    return this.prisma.walletTransaction.findMany({
      where: {
        walletId: houseWalletId,
        ...(params.before ? { createdAt: { lt: params.before } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(params.limit ?? 100, 500),
      select: {
        id: true, type: true, currencyKind: true, amountSigned: true,
        balanceAfter: true, idempotencyKey: true, refType: true, refId: true, createdAt: true,
      },
    });
  }

  /**
   * Contre-écriture d'un mouvement House (INCIDENT seulement — ex. settlement erroné
   * confirmé). Append-only : on n'efface rien, on ajoute HOUSE_REVERSAL qui référence
   * la tx d'origine (INV-06). L'audit admin est écrit par AdminService avant cet appel.
   */
  async reverseTransaction(params: {
    originalTxId: string;
    actorUserId: string;
    reason: string;
  }): Promise<{ reversalTxId: string }> {
    if (!params.reason || params.reason.trim().length < 10) {
      throw new ValidationError({ field: 'reason', reason: 'Reversal requires a documented reason (>= 10 chars).' });
    }
    const original = await this.prisma.walletTransaction.findUnique({ where: { id: params.originalTxId } });
    if (!original) throw new NotFoundError('WalletTransaction', params.originalTxId);

    const houseWalletId = await this.wallet.getHouseWalletId();
    if (original.walletId !== houseWalletId) {
      throw new ValidationError({ field: 'originalTxId', reason: 'Not a House ledger entry.' });
    }
    // Anti double-reversal : une seule contre-écriture par ligne d'origine.
    const already = await this.prisma.walletTransaction.findFirst({
      where: { reversalOfId: original.id },
      select: { id: true },
    });
    if (already) return { reversalTxId: already.id }; // idempotent (INV-04)

    const reversal = await this.prisma.$transaction(async (tx) => {
      // Le mouvement inverse : débit d'origine → crédit, et réciproquement.
      const amount = Math.abs(original.amountSigned);
      const column: CurrencyColumn = original.currencyKind === "CREDITS" ? "credits"
        : original.currencyKind === 'GEMS' ? 'gems'
        : original.currencyKind === 'TOKENS' ? 'tokens'
        : 'hardCents';
      if (original.amountSigned > 0) {
        // La tx d'origine créditait le House → on débite (jamais de découvert House implicite :
        // InsufficientFundsError remonte = incident à traiter manuellement, INV-02).
        return this.wallet.debit(tx, {
          walletId: houseWalletId,
          column,
          amount,
          type: 'REVERSAL',
          idempotencyKey: `house-reversal:${original.id}`,
          refType: 'WALLET_TX',
          refId: original.id,
        });
      }
      return this.wallet.credit(tx, {
        walletId: houseWalletId,
        column,
        amount,
        type: 'HOUSE_REVERSAL',
        idempotencyKey: `house-reversal:${original.id}`,
        refType: 'WALLET_TX',
        refId: original.id,
        reversalOfId: original.id,
      });
    });
    return { reversalTxId: reversal.id };
  }

  /** Derniers snapshots quotidiens (réconciliation comptable, observability.md §8). */
  async listSnapshots(days = 30) {
    return this.prisma.houseBalanceSnapshot.findMany({
      orderBy: { day: 'desc' },
      take: Math.min(days, 365),
    });
  }
}

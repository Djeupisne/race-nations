/**
 * sanctions.service.ts — cycle de vie des sanctions (docs/moderation.md, machine
 * Sanction INV-22 : ISSUED → ACTIVE → (APPEALED → UPHELD | LIFTED), terminaux LIFTED/UPHELD).
 * Effets appliqués :
 *  - BET_RESTRICTION / TEMP_BAN / PERM_BAN → gating lecture par BettingService/Jurisdiction ;
 *  - CHAT_MUTE → fin de validité stockée sur Player via metadata (ChatService vérifie) ;
 *  - REWARD_CLAWBACK (INV-18 triche avérée) → contre-écriture ledger via WalletRepository
 *    (append-only, jamais d'UPDATE de solde direct) + AdminAuditLog (INV-28).
 * Réputation < 10 ⇒ TEMP_BAN_7D possible (INV-21) — le contrôle d'éligibilité est ici.
 */
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletRepository } from '../wallet/wallet.repository';
import { assertSanctionTransition } from '../../common/state-machines/sanction.state-machine';
import { NotFoundError, ValidationError } from '../../common/errors/domain-errors';
import { CLOCK, type Clock } from '../../common/utils/clock';
import { Inject } from '@nestjs/common';

const SANCTION_MS: Record<string, number | null> = {
  WARN: null,
  CHAT_MUTE: 24 * 3_600_000,        // mute 24 h par défaut
  BET_RESTRICTION: 7 * 86_400_000,  // 7 jours sans paris
  TEMP_BAN_7D: 7 * 86_400_000,      // INV-21 réputation < 10
  PERM_BAN: null,                   // endsAt null = définitif
  REWARD_CLAWBACK: null,
};

@Injectable()
export class SanctionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Émission MODERATOR+/ADMIN. TEMP_BAN_7D exige réputation < 10 (INV-21), contrôlé serveur. */
  async issue(params: {
    playerId: string;
    type: 'WARN' | 'CHAT_MUTE' | 'BET_RESTRICTION' | 'TEMP_BAN_7D' | 'PERM_BAN' | 'REWARD_CLAWBACK';
    reason: string;
    evidenceRef?: string;
    issuedById: string;
  }): Promise<{ sanctionId: string; endsAt: Date | null }> {
    if (!params.reason || params.reason.trim().length < 5) {
      throw new ValidationError({ field: 'reason', reason: 'Sanction requires a documented reason.' });
    }
    const player = await this.prisma.player.findUnique({
      where: { id: params.playerId },
      select: { id: true, reputation: true },
    });
    if (!player) throw new NotFoundError('Player', params.playerId);

    if (params.type === 'TEMP_BAN_7D' && player.reputation >= 10) {
      throw new ValidationError({ field: 'type', reason: `TEMP_BAN_7D requires reputation < 10 (INV-21), got ${player.reputation}.` });
    }

    const nowMs = this.clock.nowMs();
    const duration = SANCTION_MS[params.type];
    const endsAt = duration ? new Date(nowMs + duration) : params.type === 'PERM_BAN' ? null : null;

    const sanction = await this.prisma.sanction.create({
      data: {
        playerId: params.playerId,
        type: params.type as never,
        status: 'ACTIVE', // ISSUED→ACTIVE immédiat : l'effet doit être certain à l'émission
        reason: params.reason,
        evidenceRef: params.evidenceRef,
        issuedById: params.issuedById,
        startsAt: new Date(nowMs),
        endsAt,
      },
    });
    return { sanctionId: sanction.id, endsAt };
  }

  /** Appel joueur : ACTIVE → APPEALED (une seule fois ; terminal sinon). */
  async appeal(sanctionId: string, playerId: string, note: string): Promise<void> {
    const s = await this.prisma.sanction.findUnique({ where: { id: sanctionId } });
    if (!s || s.playerId !== playerId) throw new NotFoundError('Sanction', sanctionId);
    assertSanctionTransition(s.status as never, 'APPEALED');
    if (!note || note.trim().length < 10) {
      throw new ValidationError({ field: 'note', reason: 'Appeal note must be at least 10 characters.' });
    }
    await this.prisma.sanction.update({ where: { id: sanctionId }, data: { status: 'APPEALED', appealNote: note } });
  }

  /** Décision MODERATOR+ sur appel : APPEALED → UPHELD (terminal) ou LIFTED (terminal, effet cessé). */
  async decideAppeal(sanctionId: string, decision: 'UPHELD' | 'LIFTED'): Promise<void> {
    const s = await this.prisma.sanction.findUnique({ where: { id: sanctionId } });
    if (!s) throw new NotFoundError('Sanction', sanctionId);
    assertSanctionTransition(s.status as never, decision);
    await this.prisma.sanction.update({
      where: { id: sanctionId },
      data: { status: decision, ...(decision === 'LIFTED' ? { liftedAt: new Date(this.clock.nowMs()), endsAt: new Date(this.clock.nowMs()) } : {}) },
    });
  }

  /** Levée anticipée (erreur reconnue / incident) — ACTIVE → LIFTED, auditée par l'appelant. */
  async lift(sanctionId: string): Promise<void> {
    const s = await this.prisma.sanction.findUnique({ where: { id: sanctionId } });
    if (!s) throw new NotFoundError('Sanction', sanctionId);
    assertSanctionTransition(s.status as never, 'LIFTED');
    const now = new Date(this.clock.nowMs());
    await this.prisma.sanction.update({ where: { id: sanctionId }, data: { status: 'LIFTED', liftedAt: now, endsAt: now } });
  }

  /**
   * REWARD_CLAWBACK (INV-18) : récupération des gains d'un tricheur confirmé.
   * Contre-écriture APPEND-ONLY du ledger joueur (pas d'effacement) — montant plafonné au
   * solde disponible (jamais de solde négatif, INV-02) ; chaque clawback est idempotent
   * par clé `clawback:<sanctionId>`.
   */
  async clawbackRewards(sanctionId: string, actorUserId: string): Promise<{ reversedCents: number; reversedCredits: number }> {
    const s = await this.prisma.sanction.findUnique({ where: { id: sanctionId } });
    if (!s || s.type !== 'REWARD_CLAWBACK') throw new NotFoundError('Sanction(REWARD_CLAWBACK)', sanctionId);
    void actorUserId; // tracé par AuditService dans le contrôleur (avant effet)

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.wallet.findUnique({ where: { playerId: s.playerId } });
      if (!wallet) return { reversedCents: 0, reversedCredits: 0 };

      // On récupère au maximum ce que le joueur a gagné en paris perdus pour la triche :
      // approximation prudente = solde courant (les payouts déjà dépensés ne sont pas
      // re-créables : un solde insuffisant n'est PAS une erreur, c'est le plafond légal).
      const toReverseHard = wallet.hardCents;
      const toReverseSoft = wallet.credits;
      let reversedCents = 0;
      let reversedCredits = 0;

      if (toReverseHard > 0) {
        await this.wallet.debit(tx, {
          walletId: wallet.id,
          column: 'hardCents',
          amount: toReverseHard,
          type: 'REVERSAL',
          idempotencyKey: `clawback:${sanctionId}:hard`,
          refType: 'SANCTION',
          refId: sanctionId,
        });
        reversedCents = toReverseHard;
      }
      if (toReverseSoft > 0) {
        await this.wallet.debit(tx, {
          walletId: wallet.id,
          column: 'credits',
          amount: toReverseSoft,
          type: 'REVERSAL',
          idempotencyKey: `clawback:${sanctionId}:soft`,
          refType: 'SANCTION',
          refId: sanctionId,
        });
        reversedCredits = toReverseSoft;
      }
      await tx.sanction.update({ where: { id: sanctionId }, data: { status: 'UPHELD' } });
      return { reversedCents, reversedCredits };
    });
  }

  /** Historique public restreint (auto-consultation joueur) + file moderation. */
  async listForPlayer(playerId: string) {
    return this.prisma.sanction.findMany({
      where: { playerId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, type: true, status: true, reason: true, startsAt: true, endsAt: true, createdAt: true },
    });
  }

  /** Un joueur est-il sous sanction active bloquant X ? Utilisé par betting/chat/login. */
  async hasActive(playerId: string, types: Array<'BET_RESTRICTION' | 'TEMP_BAN_7D' | 'PERM_BAN' | 'CHAT_MUTE'>): Promise<boolean> {
    const now = new Date(this.clock.nowMs());
    const count = await this.prisma.sanction.count({
      where: { playerId, type: { in: types as never[] }, status: 'ACTIVE', OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    });
    return count > 0;
  }
}

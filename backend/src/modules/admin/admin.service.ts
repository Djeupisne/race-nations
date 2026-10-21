/**
 * admin.service.ts — façade des opérations sensibles du back-office (docs/api.md §9).
 * RÈGLE ABSOLUE (INV-28) : chaque mutation passe par ici, qui écrit l'AdminAuditLog
 * AVANT l'effet métier, avec requestId de corrélation. Un échec d'audit ⇒ pas d'effet.
 * Le settlement manuel de marché (litige > 72 h ou incident) délègue à BetSettlementService
 * en conservant la garantie INV-14 (UNIQUE marketId → jamais un double règlement).
 */
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { BetSettlementService } from '../betting/bet-settlement.service';
import { GameserversService } from '../gameservers/gameservers.service';
import { SanctionsService } from '../sanctions/sanctions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ValidationError } from '../../common/errors/domain-errors';

export interface AdminActor {
  userId: string;
  role: 'ADMIN' | 'MODERATOR';
  requestId?: string;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly audit: AuditService,
    private readonly settlements: BetSettlementService,
    private readonly gameservers: GameserversService,
    private readonly sanctions: SanctionsService,
    private readonly prisma: PrismaService,
  ) {}

  private rid(actor: AdminActor): string {
    return actor.requestId ?? randomUUID();
  }

  /** Settlement MANUAL d'un marché (litige tranché, incident serveur). ADMIN only. */
  async manualSettleMarket(actor: AdminActor, params: { marketId: string; winningSide?: number; push?: boolean; reason: string }) {
    if (!params.reason || params.reason.trim().length < 10) {
      throw new ValidationError({ field: 'reason', reason: 'Manual settlement requires a documented reason.' });
    }
    await this.audit.record({
      actorUserId: actor.userId,
      action: 'BET_MANUAL_SETTLE',
      targetType: 'BetMarket',
      targetId: params.marketId,
      metadata: { winningSide: params.winningSide ?? null, push: params.push ?? false, reason: params.reason },
      requestId: this.rid(actor),
    });
    return this.settlements.settleMarket({
      marketId: params.marketId,
      winningSide: params.winningSide,
      push: params.push,
      settledById: actor.userId,
    });
  }

  /** Issue de sanction déléquée + auditée (le MODERATOR peut WARN/MUTE/RESTRICTION). */
  async issueSanction(actor: AdminActor, params: { playerId: string; type: Parameters<SanctionsService['issue']>[0]['type']; reason: string; evidenceRef?: string }) {
    const result = await this.sanctions.issue({ ...params, issuedById: actor.userId });
    await this.audit.record({
      actorUserId: actor.userId,
      action: 'SANCTION_ISSUE',
      targetType: 'Sanction',
      targetId: result.sanctionId,
      metadata: { playerId: params.playerId, type: params.type, reason: params.reason },
      requestId: this.rid(actor),
    });
    return result;
  }

  /** Drain d'un game server (maintenance) — fin des matchs en cours puis OFFLINE. */
  async drainServer(actor: AdminActor, serverId: string) {
    await this.audit.record({
      actorUserId: actor.userId,
      action: 'SERVER_DRAIN',
      targetType: 'GameServer',
      targetId: serverId,
      requestId: this.rid(actor),
    });
    return this.gameservers.drain(serverId);
  }

  /** Ouverture d'un litige marché depuis le back-office (INV-19 gel ≤ 72 h). */
  async openDispute(actor: AdminActor, marketId: string, reason: 'CHEAT_SUSPECTED' | 'RESULT_MISMATCH' | 'DISCONNECT_DISPUTE' | 'SERVER_FAULT' | 'OTHER') {
    await this.audit.record({
      actorUserId: actor.userId,
      action: 'BET_DISPUTE_OPEN',
      targetType: 'BetMarket',
      targetId: marketId,
      metadata: { reason },
      requestId: this.rid(actor),
    });
    return this.settlements.openDispute(marketId, reason);
  }

  /** Clôture d'un litige : remboursement intégral (REFUND_ALL) ou règlement maintenu (UPHELD). */
  async resolveDispute(actor: AdminActor, marketId: string, outcome: 'REFUND_ALL' | 'UPHELD', note: string) {
    await this.audit.record({
      actorUserId: actor.userId,
      action: 'BET_DISPUTE_RESOLVE',
      targetType: 'BetMarket',
      targetId: marketId,
      metadata: { outcome, note },
      requestId: this.rid(actor),
    });
    return this.settlements.resolveDispute(marketId, outcome);
  }

  /** Vue globale supervision : flotte + files + marchés litigieux (lecture simple). */
  async dashboard() {
    const [fleet, disputed, settling] = await Promise.all([
      this.gameservers.fleet(),
      this.prisma.betMarket.count({ where: { status: 'DISPUTED' } }),
      this.prisma.betMarket.count({ where: { status: 'SETTLING' } }),
    ]);
    return { fleet, disputedMarkets: disputed, settlingMarkets: settling };
  }
}

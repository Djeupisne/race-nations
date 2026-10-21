/**
 * audit.service.ts — journal d'audit ADMIN append-only (AdminAuditLog, migration 0002
 * triggers immuables + garde applicative ici : AUCUN update/delete exposé, INV-06/INV-28).
 * Chaque action sensible (settlement manuel, sanction, reversal House, drain serveur)
 * DOIT appeler record() AVANT l'effet métier ; requestId = corrélation observabilité.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditEvent {
  actorUserId: string;
  action: string; // 'BET_MANUAL_SETTLE' | 'SANCTION_ISSUE' | 'HOUSE_REVERSE' | 'SERVER_DRAIN' …
  targetType: string; // 'BetMarket' | 'Sanction' | 'HouseWallet' | 'GameServer' …
  targetId: string;
  metadata?: Record<string, unknown>;
  requestId: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** INSERT seul — la table n'a pas de voie de mutation (append-only DB-enforced). */
  async record(event: AuditEvent): Promise<{ auditId: string }> {
    const row = await this.prisma.adminAuditLog.create({
      data: {
        actorId: event.actorUserId,
        action: event.action,
        targetType: event.targetType,
        targetId: event.targetId,
        metadata: (event.metadata ?? undefined) as never,
        requestId: event.requestId,
      },
      select: { id: true },
    });
    this.logger.log(`AUDIT actor=${event.actorUserId} action=${event.action} target=${event.targetType}/${event.targetId} req=${event.requestId}`);
    return { auditId: row.id };
  }

  /** Lecture supervision : filtres combinés + pagination par curseur temporel. */
  async search(params: {
    actorUserId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    from?: Date;
    to?: Date;
    limit?: number;
  }) {
    const take = Math.min(params.limit ?? 100, 500);
    return this.prisma.adminAuditLog.findMany({
      where: {
        ...(params.actorUserId ? { actorId: params.actorUserId } : {}),
        ...(params.action ? { action: params.action } : {}),
        ...(params.targetType ? { targetType: params.targetType } : {}),
        ...(params.targetId ? { targetId: params.targetId } : {}),
        ...(params.from || params.to
          ? { createdAt: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  /** Export LCB/FT / incident : tous les événements touchant un marché donné. */
  async forMarket(marketId: string) {
    return this.prisma.adminAuditLog.findMany({
      where: { targetType: 'BetMarket', targetId: marketId },
      orderBy: { createdAt: 'asc' },
    });
  }
}

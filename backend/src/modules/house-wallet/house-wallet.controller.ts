/**
 * house-wallet.controller.ts — supervision House Wallet (docs/api.md §9, INV-28).
 * ADMIN + MODERATOR en LECTURE ; les contre-écritures (reversals) sont ADMIN-only et
 * passent par AdminService pour l'écriture AdminAuditLog AVANT effet (audit前置).
 */
import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { HouseWalletService } from './house-wallet.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUnauthenticatedError } from '../../common/errors/domain-errors';

interface AuthedRequest extends Request {
  user?: { userId: string; playerId: string | null; role: string };
}

@Roles('ADMIN', 'MODERATOR')
@Controller('v1/admin/house-wallet')
export class HouseWalletController {
  constructor(private readonly house: HouseWalletService) {}

  /** GET /v1/admin/house-wallet — solde, escrow sortant, frais cumulés. */
  @Get()
  snapshot() {
    return this.house.getSnapshot();
  }

  /** GET /v1/admin/house-wallet/transactions?limit=&before= — ledger append-only. */
  @Get('transactions')
  transactions(@Query('limit') limit?: string, @Query('before') before?: string) {
    return this.house.listTransactions({
      limit: limit ? Number(limit) : undefined,
      before: before ? new Date(before) : undefined,
    });
  }

  /** GET /v1/admin/house-wallet/snapshots?days= — réconciliation quotidienne. */
  @Get('snapshots')
  snapshots(@Query('days') days?: string) {
    return this.house.listSnapshots(days ? Number(days) : 30);
  }

  /** POST /v1/admin/house-wallet/reverse — INCIDENT only, ADMIN, audit obligatoire. */
  @Roles('ADMIN')
  @Post('reverse')
  async reverse(@Req() req: AuthedRequest, @Body() body: { originalTxId: string; reason: string }, @Param() _p: unknown) {
    void _p;
    const actorUserId = req.user?.userId;
    if (!actorUserId) throw new AuthUnauthenticatedError();
    return this.house.reverseTransaction({ originalTxId: body.originalTxId, actorUserId, reason: body.reason });
  }
}

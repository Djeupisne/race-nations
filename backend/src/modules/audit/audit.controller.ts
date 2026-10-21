/**
 * audit.controller.ts — consultation du journal AdminAuditLog (lecture ADMIN only,
 * append-only : AUCUNE mutation exposée, INV-06/INV-28).
 */
import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Roles('ADMIN')
@Controller('v1/admin/audit-log')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  /** GET /v1/admin/audit-log?actor=&action=&targetType=&targetId=&from=&to=&limit= */
  @Get()
  search(
    @Query('actor') actor?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.audit.search({
      actorUserId: actor,
      action,
      targetType,
      targetId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}

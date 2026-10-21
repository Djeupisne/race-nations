/**
 * moderation.controller.ts — routes MODERATOR+ (docs/api.md §9, docs/moderation.md).
 * Lecture file de reports + test de filtre ; les actions disciplinaires vivent dans
 * SanctionsController/AdminController (une seule voie d'écriture par prérogative).
 */
import { Body, Controller, Get, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ModerationService } from './moderation.service';
import { FilterTextSchema, DismissReportSchema, ModerationQueueQuerySchema } from './moderation.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditService } from '../audit/audit.service';
import { ValidationError, AuthUnauthenticatedError } from '../../common/errors/domain-errors';

@Roles('MODERATOR', 'ADMIN')
@Controller('v1/moderation')
export class ModerationController {
  constructor(
    private readonly moderation: ModerationService,
    private readonly audit: AuditService,
  ) {}

  /** GET /v1/moderation/reports?limit= — file anti-triche (payloads invalides). */
  @Get('reports')
  queue(@Query() query: unknown) {
    const parsed = ModerationQueueQuerySchema.safeParse(query);
    if (!parsed.success) throw new ValidationError({ field: 'query', reason: parsed.error.message });
    return this.moderation.queue(parsed.data.limit);
  }

  /** GET /v1/moderation/reports/:id — détail d'un report. */
  @Get('reports/:id')
  detail(@Param('id') id: string) {
    return this.moderation.reportDetail(id);
  }

  /** POST /v1/moderation/reports/:id/dismiss — clôture sans suite, AUDITÉE (INV-28). */
  @Post('reports/:id/dismiss')
  @HttpCode(200)
  async dismiss(@Req() req: Request & { user?: { userId: string } }, @Param('id') id: string, @Body() body: unknown) {
    const parsed = DismissReportSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError({ field: 'body', reason: parsed.error.message });
    if (!req.user?.userId) throw new AuthUnauthenticatedError();
    await this.moderation.dismissReport(id, parsed.data.note);
    await this.audit.record({
      actorUserId: req.user.userId,
      action: 'REPORT_DISMISS',
      targetType: 'ResultPayload',
      targetId: id,
      metadata: { note: parsed.data.note },
      requestId: (req.headers['x-request-id'] as string) ?? 'unknown',
    });
    return { ok: true };
  }

  /** POST /v1/moderation/filter-test — outil interne : verdict du lexique. */
  @Post('filter-test')
  filterTest(@Body() body: unknown) {
    const parsed = FilterTextSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError({ field: 'body', reason: parsed.error.message });
    return this.moderation.filterText(parsed.data.text);
  }
}

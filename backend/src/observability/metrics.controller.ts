/**
 * MetricsController — exposition Prometheus text/format sur GET /metrics.
 * @Public() : le scraper n'a pas de JWT ; la route n'est exposée QUE sur le
 * port interne (firewall/LB network policy — docs/deployment.md §5), jamais
 * publiquement. Aucune valeur métier sensible, uniquement des compteurs.
 */
import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../common/guards/jwt-auth.guard';
import { MetricsService } from './metrics.service';

@Controller()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Public()
  @Get('metrics')
  scrape(@Res() res: Response): void {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.status(200).send(this.metrics.render());
  }
}

/**
 * moderation.service.ts — pile de modération côté backend (docs/moderation.md).
 * Responsabilités :
 *  - file de reports (signals anti-triche + signalements joueurs) ;
 *  - filtrage texte (banned-words.json chargé au boot, normalisation Unicode + leetspeak) ;
 *  - actions MODERATOR : WARN/mute/ban DÉLÉGÉES à SanctionsService (jamais de double
 *    écriture) — ici on ne fait que qualifier et tracer.
 * Toute décision tombe sous INV-28 : acteur = req.user, tracé par AuditService.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundError, ValidationError } from '../../common/errors/domain-errors';
import * as bannedWords from './banned-words.json';

/** Verdict du filtre texte — exporté : utilisé dans les signatures publiques de
 * ModerationService, TextFilterService.inspect et ModerationController.filterTest
 * (sinon TS4053 "cannot be named"). */
export interface TextVerdict {
  clean: boolean;
  matchedTerms: string[];
  severity: 'none' | 'toxic' | 'cheat_ad' | 'pii';
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  /** Index des mots interdits par catégorie — construction unique au boot (immutable ensuite). */
  private readonly lexicon: Map<string, string[]> = new Map(Object.entries(bannedWords as Record<string, string[]>));

  constructor(private readonly prisma: PrismaService) {}

  /** Normalisation : minuscules, NFKD (accents/digits pleine chasse), suppression séparateurs. */
  private normalize(input: string): string {
    return input
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // diacritiques
      .toLowerCase()
      .replace(/[0]/g, 'o')
      .replace(/[1]/g, 'i')
      .replace(/[3]/g, 'e')
      .replace(/[4]/g, 'a')
      .replace(/[5]/g, 's')
      .replace(/[7]/g, 't')
      .replace(/[^a-z]/g, ''); // leetspeak grossier + collages "b a d  w o r d"
  }

  /** Filtre texte temps réel (chat, bios, noms de clan) — appelé par ChatService/ClansService. */
  filterText(raw: string): TextVerdict {
    const normalized = this.normalize(raw);
    const matched: string[] = [];
    let severity: TextVerdict['severity'] = 'none';
    for (const [category, terms] of this.lexicon) {
      for (const term of terms) {
        if (normalized.includes(this.normalize(term))) {
          matched.push(`${category}:${term}`);
          if (category === 'pii' || category === 'cheat_ad') severity = category;
          else if (severity === 'none') severity = 'toxic';
        }
      }
    }
    return { clean: matched.length === 0, matchedTerms: matched, severity };
  }

  /** File de reports : incidents anti-cheat (ResultPayload invalides) + signalements chat. */
  async queue(limit = 50) {
    const cheatReports = await this.prisma.resultPayload.findMany({
      where: { valid: false },
      orderBy: { receivedAt: 'desc' },
      take: limit,
      select: { id: true, matchId: true, invalidReason: true, receivedAt: true },
    });
    return { cheatReports };
  }

  /** Détail d'un report anti-triche — payload brut conservé pour arbitrage (INV-25). */
  async reportDetail(payloadId: string) {
    const p = await this.prisma.resultPayload.findUnique({ where: { id: payloadId } });
    if (!p) throw new NotFoundError('ResultPayload', payloadId);
    return {
      id: p.id,
      matchId: p.matchId,
      valid: p.valid,
      invalidReason: p.invalidReason,
      receivedAt: p.receivedAt,
      body: p.body,
    };
  }

  /**
   * Fermeture manuelle d'un report sans suite : le payload reste en base (append-only) ;
   * on trace juste la décision via l'audit (appel AdminService.record par le contrôleur).
   */
  async dismissReport(payloadId: string, note: string): Promise<void> {
    if (!note || note.trim().length < 5) {
      throw new ValidationError({ field: 'note', reason: 'Dismissal requires a note.' });
    }
    const p = await this.prisma.resultPayload.findUnique({ where: { id: payloadId }, select: { id: true } });
    if (!p) throw new NotFoundError('ResultPayload', payloadId);
    this.logger.log(`Report ${payloadId} dismissed with note: ${note.slice(0, 120)}`);
  }
}

/**
 * text-filter.service.ts — wrapper DI du filtre de ModerationService, consommé par
 * ChatService/ClansService/UsersService (noms, bios, messages). Délégation simple :
 * la logique (normalisation + lexique) vit dans ModerationService — source unique.
 */
import { Injectable } from '@nestjs/common';
import { ModerationService } from './moderation.service';

@Injectable()
export class TextFilterService {
  constructor(private readonly moderation: ModerationService) {}

  isClean(text: string): boolean {
    return this.moderation.filterText(text).clean;
  }

  assertClean(text: string): void {
    const verdict = this.moderation.filterText(text);
    if (!verdict.clean) {
      // Message générique : on ne fuit JAMAIS le terme exact côté client (anti-énumération).
      throw Object.assign(new Error('Message contains prohibited terms.'), { status: 400, code: 'MODERATION_BLOCKED' });
    }
  }

  inspect(text: string) {
    return this.moderation.filterText(text);
  }
}

/**
 * Clock — horloge injectable (INV-29).
 * Règle stricte : AUCUN `new Date()` dans le code métier. Les fenêtres temporelles
 * (limite 24h INV-12, litige 72h INV-19, reconnexion 30s INV-17) passent par Clock.
 * En test : FixedClock fige le temps ; en prod : SystemClock.
 */
export interface Clock {
  /** Temps courant en Date — horodatage des colonnes createdAt/updatedAt et objets Date métier. */
  now(): Date;
  /** Temps courant en ms epoch (source unique des comparaisons et calculs de durée). */
  nowMs(): number;
}

/** Horloge système (défaut DI en production). */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
  nowMs(): number {
    return Date.now();
  }
}

/** Horloge figée pour les tests déterministes. */
export class FixedClock implements Clock {
  private current: number;
  constructor(startMs: number | string = Date.now()) {
    this.current = typeof startMs === 'string' ? Date.parse(startMs) : startMs;
  }
  now(): Date {
    return new Date(this.current);
  }
  nowMs(): number {
    return this.current;
  }
  set(ms: number | string): void {
    this.current = typeof ms === 'string' ? Date.parse(ms) : ms;
  }
  advance(ms: number): void {
    this.current += ms;
  }
}

/** Jeton DI — fournir SystemClock dans AppModule, remplacer par FixedClock dans les tests e2e. */
export const CLOCK = Symbol('CLOCK');

/** Instance système partagée (pragmatique pour scripts/tests qui importent `clock`). */
export const clock: Clock = new SystemClock();

/** Helper : âge en ms d'un timestamp par rapport à l'horloge fournie (jamais négatif). */
export function ageMs(sinceEpochMs: number, clock: Clock): number {
  return Math.max(0, clock.nowMs() - sinceEpochMs);
}

/**
 * Clock — horloge injectable (INV-29).
 * Règle stricte : AUCUN `new Date()` dans le code métier. Les fenêtres temporelles
 * (limite 24h INV-12, litige 72h INV-19, reconnexion 30s INV-17) utilisent Clock.now().
 * En test : FixedClock fige le temps ; en prod : SystemClock.
 */
export interface Clock {
  /** Temps courant en ms epoch (source unique des comparaisons métier). */
  now(): number;
  /** Temps courant en Date — uniquement pour l'horodatage des colonnes createdAt/updatedAt métier. */
  date(): Date;
}

/** Horloge système (défaut DI en production). */
export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
  date(): Date {
    return new Date(this.now());
  }
}

/** Horloge figée pour les tests déterministes. */
export class FixedClock implements Clock {
  private current: number;
  constructor(startMs: number | string = Date.now()) {
    this.current = typeof startMs === 'string' ? Date.parse(startMs) : startMs;
  }
  now(): number {
    return this.current;
  }
  date(): Date {
    return new Date(this.current);
  }
  set(ms: number | string): void {
    this.current = typeof ms === 'string' ? Date.parse(ms) : ms;
  }
  advance(ms: number): void {
    this.current += ms;
  }
}

/** Jeton DI — fournir SystemClock dans AppModule, remplacer dans les tests e2e. */
export const CLOCK = Symbol('CLOCK');

/** Helper : âge en ms d'un timestamp par rapport à l'horloge fournie. */
export function ageMs(sinceEpochMs: number, clock: Clock): number {
  return Math.max(0, clock.now() - sinceEpochMs);
}

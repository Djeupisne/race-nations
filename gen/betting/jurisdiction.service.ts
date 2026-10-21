/**
 * jurisdiction.service.ts — gating géographique des paris (INV-20, docs/betting-legal.md).
 * Source de vérité : table `jurisdiction_configs` (seedée par scripts/seed-prod.sh).
 * Règle : FR/USA = DISABLED (aucun pari, aucune exception) ; pays sous licence =
 * ENABLED_SOFT ou ENABLED_HARD selon l'état réel de la licence (jamais "en dur" dans le code).
 * Cache mémoire 30 s pour éviter un SELECT sur chaque requête de validation (lecture seule).
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JurisdictionBlockedError } from '../../common/errors/betting-errors';
import { NotFoundError } from '../../common/errors/domain-errors';

export interface JurisdictionView {
  countryCode: string;
  countryName: string;
  licenseAuthority: string | null;
  licenseStatus: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DENIED';
  bettingActivation: 'DISABLED' | 'PENDING' | 'ENABLED_SOFT' | 'ENABLED_HARD';
  dailyHardLimitCents: number | null;
  monthlyHardLimitCents: number | null;
  yearlyHardLimitCents: number | null;
}

const CACHE_TTL_MS = 30_000;

@Injectable()
export class JurisdictionService {
  private readonly logger = new Logger(JurisdictionService.name);
  /** countryCode → { view, fetchedAt }. Invaldé par TTL + invalidate() admin. */
  private cache = new Map<string, { view: JurisdictionView; fetchedAt: number }>();

  constructor(private readonly prisma: PrismaService) {}

  /** Lecture simple — 404 si pays absent du seed (le seed EST la matrice légale). */
  async get(countryCode: string): Promise<JurisdictionView> {
    const cc = this.normalize(countryCode);
    const hit = this.cache.get(cc);
    if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) return hit.view;

    const row = await this.prisma.jurisdictionConfig.findUnique({ where: { countryCode: cc } });
    if (!row) throw new NotFoundError('JurisdictionConfig', cc);
    const view: JurisdictionView = {
      countryCode: row.countryCode,
      countryName: row.countryName,
      licenseAuthority: row.licenseAuthority,
      licenseStatus: row.licenseStatus,
      bettingActivation: row.bettingActivation,
      dailyHardLimitCents: row.dailyHardLimitCents,
      monthlyHardLimitCents: row.monthlyHardLimitCents,
      yearlyHardLimitCents: row.yearlyHardLimitCents,
    };
    this.cache.set(cc, { view, fetchedAt: Date.now() });
    return view;
  }

  /**
   * Garde d'accès paris — LÈVE JurisdictionBlockedError (INV-20) si le pays n'autorise
   * PAS la devise demandée. Le countryCode provient TOUJOURS du profil joueur côté
   * serveur (jamais d'un champ client : anti-contournement, cf. payments.controller).
   */
  async assertAllowed(countryCode: string, currency: 'SOFT' | 'HARD'): Promise<JurisdictionView> {
    const view = await this.get(countryCode);
    const ok =
      currency === 'SOFT'
        ? view.bettingActivation === 'ENABLED_SOFT' || view.bettingActivation === 'ENABLED_HARD'
        : view.bettingActivation === 'ENABLED_HARD';
    if (!ok) {
      this.logger.warn(`Bet blocked country=${view.countryCode} currency=${currency} activation=${view.bettingActivation}`);
      throw new JurisdictionBlockedError(view.countryCode, currency);
    }
    return view;
  }

  /** Plafond journalier HARD applicable au pays (null → plafond global de betting.config). */
  async dailyHardLimit(countryCode: string): Promise<number | null> {
    const v = await this.get(countryCode);
    return v.dailyHardLimitCents;
  }

  /** Purge le cache — appelé après une mise à jour admin de la matrice (runbook §5). */
  invalidate(countryCode?: string): void {
    if (countryCode) this.cache.delete(this.normalize(countryCode));
    else this.cache.clear();
  }

  /** Matrice complète pour l'admin panel / supervision. */
  async list(): Promise<JurisdictionView[]> {
    const rows = await this.prisma.jurisdictionConfig.findMany({ orderBy: { countryCode: 'asc' } });
    return rows.map((r) => ({
      countryCode: r.countryCode,
      countryName: r.countryName,
      licenseAuthority: r.licenseAuthority,
      licenseStatus: r.licenseStatus,
      bettingActivation: r.bettingActivation,
      dailyHardLimitCents: r.dailyHardLimitCents,
      monthlyHardLimitCents: r.monthlyHardLimitCents,
      yearlyHardLimitCents: r.yearlyHardLimitCents,
    }));
  }

  private normalize(cc: string): string {
    const up = (cc ?? '').toUpperCase().trim();
    if (!/^[A-Z]{2}$/.test(up)) throw new NotFoundError('JurisdictionConfig', cc);
    return up;
  }
}

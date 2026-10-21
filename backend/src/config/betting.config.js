"use strict";
/**
 * betting.config.ts — constantes contractuelles du domaine paris (docs/betting.md §2).
 * ⚠️ Ces valeurs sont des CONTRATS : chaque constante est citée par les invariants
 * INV-08..INV-21 et testée par backend/test/betting*.e2e-spec.ts. Toute modification
 * exige migration documentée + MAJ des tests (cf. docs/betting.md §2, docs/runbook.md §5).
 *
 * Surcharge par variables d'environnement (uniquement pour les kill-switch et le pilotage
 * par juridiction) ; les bornes économiques ne sont PAS surchargeables au runtime —
 * elles changent par PR revue, jamais par env.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BETTING_CONFIG = exports.BETTING_CONSTANTS = void 0;
exports.loadBettingConfig = loadBettingConfig;
exports.stakeBounds = stakeBounds;
/** Valeurs par défaut contractuelles — source doc : docs/betting.md §2. */
exports.BETTING_CONSTANTS = {
    /** houseEdgeBps = 500 → commission 5 % (cahier §3.10, INV-08/INV-13). */
    HOUSE_EDGE_BPS: 500,
    /** Bornes de mise SOFT (crédits) — game-modes §10.1, INV-11. */
    SOFT_STAKE_MIN: 10,
    SOFT_STAKE_MAX: 10000,
    /** Bornes de mise HARD (centimes) = 1 €–100 € — game-modes §10.1, INV-11. */
    HARD_STAKE_MIN_CENTS: 100,
    HARD_STAKE_MAX_CENTS: 10000,
    /** Paris de tournoi (crédits) — game-modes §10.6, INV-11. */
    TOURNAMENT_STAKE_MIN: 50,
    TOURNAMENT_STAKE_MAX: 50000,
    /** Fenêtre glissante limite journalière SOFT (crédits) — INV-12. */
    DAILY_SOFT_LIMIT: 10000,
    /** Durée de la fenêtre glissante journalière (ms) — 24 h. */
    DAILY_WINDOW_MS: 24 * 3600000,
    /** Écart de PL max pour l'appariement des défis publics — game-modes §10.1. */
    PL_DELTA_MAX: 300,
    /** Tolérance de déconnexion avant abandon (ms) — game-modes §10.4, INV-17. */
    DISCONNECT_TOLERANCE_MS: 30000,
    /** Délai max de résolution d'un litige (ms) — game-modes §10.4, INV-19. */
    DISPUTE_MAX_AGE_MS: 72 * 3600000,
    /** Réputation minimale pour parier en HARD — cahier §4.3, INV-21. */
    MIN_REPUTATION_HARD: 30,
    /** Âge minimum pour HARD (années) — roadmap Month 11+, INV-21. */
    MIN_AGE_HARD: 18,
    /** Plafond mensuel HARD global hors plafond juridiction (centimes) — LCB/FT. */
    MONTHLY_HARD_CAP_CENTS: 1000000,
};
var TRUTHY = new Set(['1', 'true', 'yes', 'on']);
/** Lecture défensive : toute valeur non reconnue = défaut sûr (activé), SAUF flag explicite 'false'. */
function readFlag(env, name, fallback) {
    var raw = env[name];
    if (raw === undefined || raw === '')
        return fallback;
    return TRUTHY.has(raw.toLowerCase());
}
/** Fabrique DI — injecter via ConfigModule ; les services lisent flags AU MOMENT de l'appel (pas de cache). */
function loadBettingConfig(env) {
    if (env === void 0) { env = process.env; }
    return {
        constants: exports.BETTING_CONSTANTS,
        flags: function () { return ({
            hardEnabled: readFlag(env, 'BETTING_HARD_ENABLED', true),
            softEnabled: readFlag(env, 'BETTING_SOFT_ENABLED', true),
            matchmakingPaused: readFlag(env, 'MATCHMAKING_PAUSED', false),
            depositsPaused: readFlag(env, 'PAYMENTS_DEPOSITS_PAUSED', false),
        }); },
    };
}
/** Jeton DI Nest — `@Inject(BETTING_CONFIG) private readonly betting: BettingConfig`. */
exports.BETTING_CONFIG = Symbol('BETTING_CONFIG');
/** Helper bornes par devise (INV-11) — utilisé par bet-validator + DTOs. */
function stakeBounds(currency) {
    return currency === 'SOFT'
        ? { min: exports.BETTING_CONSTANTS.SOFT_STAKE_MIN, max: exports.BETTING_CONSTANTS.SOFT_STAKE_MAX }
        : { min: exports.BETTING_CONSTANTS.HARD_STAKE_MIN_CENTS, max: exports.BETTING_CONSTANTS.HARD_STAKE_MAX_CENTS };
}

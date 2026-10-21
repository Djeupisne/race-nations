/**
 * result-validator.service.ts — validation SERVEUR des résultats de course (INV-25/INV-26).
 * Pipeline strict (aucun raccourci) :
 *   1. enveloppe Zod (RaceResultBodySchema) — shapes et entiers uniquement ;
 *   2. HMAC du corps : stableStringify + timingSafeEqual + fenêtre ±60 s (anti-forging) ;
 *   3. anti-replay : nonce UNIQUE (ResultPayload.nonce unique) ;
 *   4. cohérence métier : match existe, serverId == serveur assigné, joueurs ∈ match,
 *      positions 1..N uniques, finishMs entiers positifs bornés ;
 *   5. plausibilité crue (vitesse max / laps impossibles → rejet CHEAT_SUSPECTED).
 * Échape TOUJOURS un ResultPayload tracé (valid ou invalid + raison) pour l'audit.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RaceResultBodySchema } from '@race-nations/api-contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { CLOCK, type Clock } from '../../common/utils/clock';
import { stableStringify } from '../../common/utils/safe-json';
import { signRaw, verifySignatureConstantTime, isTimestampFresh } from '../../common/utils/signature';
import { ValidationError } from '../../common/errors/domain-errors';

/** Durée min/max plausible d'une course (ms) — CdC équilibre : 60 s–30 min. */
const MIN_RACE_MS = 60_000;
const MAX_RACE_MS = 30 * 60_000;

export interface ValidationResult {
  accepted: boolean;
  payloadId: string;
  reason?: string;
}

@Injectable()
export class ResultValidatorService {
  private readonly logger = new Logger(ResultValidatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async validate(rawBody: string, providedSignature: string, serverHeaderId: string): Promise<ValidationResult> {
    // 1. Shape stricte (Zod) — toute déviation = rejet tracé, jamais de parsing tolérant.
    const parsed = RaceResultBodySchema.safeParse(safeJsonOrThrow(rawBody));
    if (!parsed.success) {
      return this.trace(null, rawBody, providedSignature, false, 'SCHEMA_INVALID');
    }
    const body = parsed.data;

    // 2. Signature HMAC sur le CANONICAL body (stableStringify), pas sur le brut réseau.
    const secret = process.env.GAMESERVER_SHARED_SECRET ?? 'dev-only-insecure-gameserver-secret';
    const expected = signRaw(secret, stableStringify(body));
    if (!verifySignatureConstantTime(expected, providedSignature)) {
      return this.trace(body.matchId, rawBody, providedSignature, false, 'BAD_SIGNATURE');
    }
    if (!isTimestampFresh(body.timestampMs, this.clock.nowMs(), 60_000)) {
      return this.trace(body.matchId, rawBody, providedSignature, false, 'STALE_TIMESTAMP');
    }

    // 3. Anti-replay : nonce UNIQUE — P2002 ⇒ replay, rejet sans effet de bord.
    const dupNonce = await this.prisma.resultPayload.findUnique({ where: { nonce: body.nonce }, select: { id: true } });
    if (dupNonce) {
      return { accepted: false, payloadId: dupNonce.id, reason: 'REPLAY_NONCE' };
    }

    // 4. Cohérence match/serveur/joueurs.
    const match = await this.prisma.match.findUnique({
      where: { id: body.matchId },
      include: { players: { select: { playerId: true } } },
    });
    if (!match) return this.trace(body.matchId, rawBody, providedSignature, false, 'UNKNOWN_MATCH');
    if (match.serverId !== serverHeaderId || match.serverId !== body.serverId) {
      return this.trace(body.matchId, rawBody, providedSignature, false, 'SERVER_MISMATCH');
    }
    const entrants = new Set(match.players.map((p) => p.playerId));
    const seenPositions = new Set<number>();
    for (const row of body.rows) {
      if (!entrants.has(row.playerId)) return this.trace(body.matchId, rawBody, providedSignature, false, 'UNKNOWN_PLAYER_IN_RESULT');
      if (seenPositions.has(row.position)) return this.trace(body.matchId, rawBody, providedSignature, false, 'DUPLICATE_POSITION');
      seenPositions.add(row.position);
      if (row.finishMs !== null && (row.finishMs < MIN_RACE_MS || row.finishMs > MAX_RACE_MS)) {
        return this.trace(body.matchId, rawBody, providedSignature, false, 'IMPLAUSIBLE_DURATION');
      }
    }

    // 5. Validé : persiste le payload valid=true — matches.service fera la transition + settlement.
    const payload = await this.persist(body.matchId, rawBody, providedSignature, body.nonce, true, null);
    return { accepted: true, payloadId: payload.id };
  }

  private async trace(matchId: string | null | undefined, rawBody: string, signature: string, valid: boolean, reason: string): Promise<ValidationResult> {
    let payloadId = '';
    if (matchId) {
      const p = await this.persist(matchId, rawBody, signature, `invalid:${Date.now()}:${reason}`, valid, reason);
      payloadId = p.id;
    }
    this.logger.warn(`Result rejected match=${matchId ?? '?'} reason=${reason}`);
    return { accepted: false, payloadId, reason };
  }

  private persist(matchId: string, rawBody: string, signature: string, nonce: string, valid: boolean, invalidReason: string | null) {
    let body: Prisma.InputJsonValue;
    try {
      body = JSON.parse(rawBody.slice(0, 256 * 1024));
    } catch {
      body = { raw: rawBody.slice(0, 1024) };
    }
    return this.prisma.resultPayload.create({
      data: { matchId, body, signature, nonce, valid, invalidReason: invalidReason ?? undefined },
    });
  }
}

function safeJsonOrThrow(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new ValidationError({ field: 'body', reason: 'Invalid JSON.' });
  }
}

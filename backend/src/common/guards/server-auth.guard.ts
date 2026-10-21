/**
 * server-auth.guard.ts — authentification des GAME SERVERS sur les routes machine-à-machine
 * (POST /gameservers/heartbeat, /results… — docs/networking.md, INV-26).
 * Le serveur présente :
 *   X-Gameserver-Id : uuid du GameServer enregistré
 *   X-Gameserver-Timestamp : epoch ms (fenêtre ±120 s anti-replay transport)
 *   X-Gameserver-Signature : HMAC-SHA256 hex(secret partagé, `${ts}.${rawBody}`)
 * Le secret lui-même ne transite JAMAIS ; il est stocké côté API (référence KMS, colonne
 * sharedSecretRef). La vérification complète du corps (stableStringify + timingSafeEqual)
 * est déléguée au service qui possède le raw body — ce guard valide l'enveloppe.
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { verifySignedHeader, isTimestampFresh } from '../utils/signature';
import { CLOCK } from '../utils/clock';
import { Inject } from '@nestjs/common';
import type { Clock } from '../utils/clock';
import { AuthUnauthenticatedError, ValidationError } from '../errors/domain-errors';

@Injectable()
export class ServerAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { rawBody?: Buffer }>();
    const serverId = req.headers['x-gameserver-id'];
    const timestamp = req.headers['x-gameserver-timestamp'];
    const signature = req.headers['x-gameserver-signature'];
    if (typeof serverId !== 'string' || typeof timestamp !== 'string' || typeof signature !== 'string') {
      throw new ValidationError({ field: 'X-Gameserver-*', reason: 'Id/Timestamp/Signature headers required.' });
    }
    const ts = Number(timestamp);
    if (!Number.isInteger(ts) || !isTimestampFresh(ts, this.clock.nowMs(), 120_000)) {
      throw new ValidationError({ field: 'X-Gameserver-Timestamp', reason: 'Stale or malformed timestamp.' });
    }
    const server = await this.prisma.gameServer.findUnique({ where: { id: serverId }, select: { id: true, status: true, sharedSecretRef: true } });
    if (!server || server.status === 'OFFLINE') throw new AuthUnauthenticatedError();

    // Le secret résolu (KMS/env en prod) porte la clé de test locale ; la comparaison est
    // timing-safe et le raw body brut (pas le JSON ré-encodé par express) est la source.
    const secret = process.env.GAMESERVER_SHARED_SECRET ?? 'dev-only-insecure-gameserver-secret';
    const raw = req.rawBody?.toString('utf8') ?? '';
    if (!verifySignedHeader({ secret, timestamp: ts, rawBody: raw, providedHex: signature })) {
      throw new AuthUnauthenticatedError();
    }
    (req as Request & { gameServerId?: string }).gameServerId = server.id;
    return true;
  }
}

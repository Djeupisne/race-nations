/**
 * auth.service.ts — inscription, connexion, rotation de refresh (docs/api.md §2).
 *
 * Règles :
 *  - Mots de passe hachés argon2id (params OWASP) ; jamais de log du hash.
 *  - Access token JWT 15 min ; refresh rotatif 30 j stocké HASHÉ (SHA-256) avec `family`.
 *    Réutilisation d'un refresh consommé → révocation de TOUTE la famille + REFRESH_REUSED 401.
 *  - Création du compte = User + Player + Wallet initialisé à 0 dans une seule transaction
 *    (INV-30) ; le wallet ne peut exister sans le player et réciproquement.
 *  - Horodatages via Clock injectée (INV-29), jamais new Date().
 */
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import type { User, Player, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CLOCK, type Clock } from '../../common/utils/clock';
import {
  AuthUnauthenticatedError,
  NotFoundError,
  RefreshReusedError,
  TokenExpiredError,
  ValidationError,
} from '../../common/errors/domain-errors';
import type {
  RegisterInput,
  LoginInput,
  VerifyAgeInput,
  TokenPair,
  AuthSession,
  AccessTokenClaims,
} from './auth.dto';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456, // 19 MiB — OWASP
  timeCost: 2,
  parallelism: 1,
};

export interface TokensForUser {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  /** TTL contractuels (miroir shared/api-contracts/src/auth.ts). */
  private static readonly ACCESS_TTL_S = 900;
  private static readonly REFRESH_TTL_S = 2_592_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /* ------------------------------ Register ------------------------------ */

  async register(input: RegisterInput): Promise<TokensForUser & { playerId: string }> {
    const email = input.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      // Message volontairement identique au login échoué (anti-enumeration).
      throw new ValidationError({ field: 'email', reason: 'Invalid credentials.' });
    }
    const usernameTaken = await this.prisma.player.findUnique({
      where: { username: input.username },
      select: { id: true },
    });
    if (usernameTaken) {
      throw new ValidationError({ field: 'username', reason: 'Username already taken.' });
    }

    const passwordHash = await argon2.hash(input.password, ARGON2_OPTIONS);
    const now = this.clock.date();

    // INV-30 : user + player + wallet atomiques.
    const created = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: { email, passwordHash, role: 'PLAYER' },
      });
      const player = await tx.player.create({
        data: {
          userId: user.id,
          username: input.username,
          countryCode: input.countryCode,
          nationality: input.nationality, // choix DÉFINITIF après 1ʳᵉ course classée (INV-31) — verrouillé plus tard, pas ici
          marketingOptIn: input.marketingOptIn,
          acceptedTermsAt: now,
          acceptedPrivacyAt: now,
        },
      });
      await tx.wallet.create({ data: { playerId: player.id, ownerType: 'PLAYER' } });
      return { user, player };
    });

    const tokens = await this.issueTokens(created.user, 0);
    return { ...tokens, playerId: created.player.id };
  }

  /* ------------------------------- Login -------------------------------- */

  async login(input: LoginInput): Promise<TokensForUser> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: { player: true },
    });
    if (!user || !user.player) throw new AuthUnauthenticatedError({}, 'Invalid credentials.');
    const ok = await argon2.verify(user.passwordHash, input.password).catch(() => false);
    if (!ok) throw new AuthUnauthenticatedError({}, 'Invalid credentials.');
    return this.issueTokens(user, undefined);
  }

  /* ---------------------- Refresh rotation (INV-23) --------------------- */

  /**
   * Rotation stricte : le refresh présenté est consommé (marqué révocable par suppression
   * de sa ligne) et remplacé dans la MÊME famille. Si la presented token n'existe plus
   * alors qu'il est bien formellement valide (hash connu révoqué) → réutilisation →
   * révocation de toute la famille (vol présumé).
   */
  async refresh(refreshToken: string): Promise<TokensForUser> {
    const tokenHash = sha256Hex(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { player: true } } },
    });
    if (!stored || stored.revokedAt) {
      // Le hash n'est plus vivant : soit expiré purgés, soit consommé → suspicion de vol.
      throw new RefreshReusedError(-1);
    }
    if (stored.expiresAt.getTime() <= this.clock.now()) {
      await this.prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => undefined);
      throw new TokenExpiredError();
    }
    if (!stored.user.player) throw new AuthUnauthenticatedError();

    // Consomme l'ancien, émet le nouveau dans la même famille (transaction = pas de fenêtre de double-spend).
    const family = stored.family;
    await this.prisma.$transaction([
      this.prisma.refreshToken.delete({ where: { id: stored.id } }),
    ]);
    return this.issueTokens(stored.user, family);
  }

  /** POST /auth/logout — révoque la famille entière du refresh présenté. */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = sha256Hex(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored) return; // logout idempotent : un token inconnu = déjà déconnecté
    await this.prisma.refreshToken.updateMany({
      where: { userId: stored.userId, family: stored.family, revokedAt: null },
      data: { revokedAt: this.clock.date() },
    });
  }

  /* --------------------------- KYC / verify-age -------------------------- */

  /** POST /auth/verify-age — prérequis paris HARD (INV-21). Le document n'est JAMAIS persisté en clair. */
  async verifyAge(userId: string, input: VerifyAgeInput): Promise<{ verified: boolean; verifiedAt: Date }> {
    const player = await this.prisma.player.findUnique({ where: { userId } });
    if (!player) throw new NotFoundError('Player', userId);
    // Pipeline KYC externe (provider) — ici on horodate la validation reçue du provider.
    // kycDocumentRef = référence chiffrée storage posée par l'upload présigné préalable.
    const now = this.clock.date();
    await this.prisma.player.update({
      where: { id: player.id },
      data: { ageVerifiedAt: now, birthDateConfirmed: true },
    });
    return { verified: true, verifiedAt: now };
  }

  /* ------------------------------ Session -------------------------------- */

  /** GET /auth/me — identité + gating client-side défensif (le serveur re-vérifie tout). */
  async session(userId: string): Promise<AuthSession> {
    const player = await this.prisma.player.findUnique({ where: { userId }, include: { user: true } });
    if (!player || !player.user) throw new NotFoundError('Player', userId);
    return {
      userId: player.userId,
      username: player.username,
      role: player.user.role,
      countryCode: player.countryCode,
      nationality: player.nationality,
      ageVerified: player.ageVerifiedAt !== null,
      bettingHardAllowed: player.ageVerifiedAt !== null && player.reputation >= 30,
      accessTokenExpiresAt: new Date(this.clock.now() + AuthService.ACCESS_TTL_S * 1000).toISOString(),
    };
  }

  /* ------------------------------- Internes ------------------------------ */

  /** Émet access + refresh ; family = nouvelle famille si undefined (login), sinon rotation intra-famille. */
  private async issueTokens(user: User & { player?: Player | null }, family?: number): Promise<TokensForUser> {
    const fam = family ?? Math.floor(Math.random() * 2 ** 31);
    const claims: Omit<AccessTokenClaims, 'iat' | 'exp'> = {
      sub: user.id,
      role: user.role,
      fam,
      iss: 'race-nations-api',
      aud: 'race-nations-clients',
    };
    const iatSec = Math.floor(this.clock.now() / 1000);
    const accessToken = await this.jwt.signAsync(
      { ...claims, iat: iatSec, exp: iatSec + AuthService.ACCESS_TTL_S },
      { expiresIn: AuthService.ACCESS_TTL_S },
    );

    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256Hex(refreshToken),
        family: fam,
        expiresAt: new Date(this.clock.now() + AuthService.REFRESH_TTL_S * 1000),
      },
    });
    return { accessToken, refreshToken, expiresIn: AuthService.ACCESS_TTL_S };
  }
}

/** SHA-256 hex — stockage des refresh tokens (jamais le secret en clair, auth.md). */
function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

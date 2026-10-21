/**
 * users.service.ts — gestion du compte d'authentification (docs/api.md §2/§3).
 * Le `User` porte l'identité (email, hash, rôle) ; le profil joueur est dans Player
 * (module players). Ce service expose les opérations centrées compte :
 *  - changement d'email/mot de passe (re-hash argon2id, révocation des familles de refresh),
 *  - suppression de compte RGPD (anonymisation + purge ledger conservée pour comptabilité légitime),
 *  - lookup interne pour les autres modules (jamais via SQL direct ailleurs).
 *
 * Règles : aucun log d'email en clair complet (observability.md §2) ; horodatage Clock (INV-29).
 */
import { Inject, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CLOCK, type Clock } from '../../common/utils/clock';
import { AuthUnauthenticatedError, NotFoundError, ValidationError } from '../../common/errors/domain-errors';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Lookup par userId — utilisé par JwtStrategy/guards/admin. Retourne null si absent. */
  async findById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  /** Changement de mot de passe : vérifie l'ancien, re-hash, révoque TOUTES les sessions. */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8 || newPassword.length > 128) {
      throw new ValidationError({ field: 'password', reason: 'Length must be 8–128.' });
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User', userId);
    const ok = await argon2.verify(user.passwordHash, currentPassword).catch(() => false);
    if (!ok) throw new AuthUnauthenticatedError({}, 'Current password is incorrect.');

    const hash = await argon2.hash(newPassword, ARGON2_OPTIONS);
    const now = this.clock.now();
    // Transaction (INV-30) : jamais un nouveau hash sans révocation des refresh vivants.
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
  }

  /** Changement d'email — exige une revalidation (token de confirmation consommé ailleurs). */
  async changeEmail(userId: string, newEmail: string): Promise<void> {
    const email = newEmail.toLowerCase();
    const clash = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (clash) throw new ValidationError({ field: 'email', reason: 'Email already in use.' });
    await this.prisma.user.update({ where: { id: userId }, data: { email } });
  }

  /**
   * Suppression de compte (RGPD droit à l'effacement) :
   *  - anonymise User/Player (PII détruite),
   *  - CONSERVE le ledger WalletTransaction et BetSettlement (obligation comptable/LCB-FT,
   *    betting-legal.md §5) — les lignes monétaires ne sont pas des données personnelles nominatives.
   * Anti-double-suppression : idempotent (second appel = no-op silencieux côté contrôleur).
   */
  async deleteAccount(userId: string): Promise<{ deleted: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { player: true } });
    if (!user) return { deleted: false };
    const anonSuffix = `gdpr-${userId.slice(0, 8)}`;
    await this.prisma.$transaction(async (tx) => {
      if (user.player) {
        await tx.player.update({
          where: { id: user.player.id },
          data: {
            username: `${anonSuffix}-${Math.floor(this.clock.nowMs() % 1_000_000)}`,
            countryCode: 'XX',
            acceptedTermsAt: null,
            acceptedPrivacyAt: null,
            kycDocumentRef: null,
            marketingOptIn: false,
          },
        });
      }
      await tx.refreshToken.deleteMany({ where: { userId } });
      await tx.user.update({
        where: { id: userId },
        data: { email: `${anonSuffix}@deleted.invalid`, passwordHash: '!!DELETED!!' },
      });
    });
    return { deleted: true };
  }

  /** ProfilSelf — projection sans PII sensible pour GET /users/me. */
  async getProfile(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { player: { select: { username: true } } },
    });
    if (!user) throw new NotFoundError('User', userId);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.player?.username ?? null,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(
    userId: string,
    dto: { displayName?: string; avatarKey?: string; preferredLanguage?: string },
  ): Promise<Record<string, unknown>> {
    // Champs whitelist uniquement — jamais role/email ici.
    // displayName/préférences vivent sur Player (le modèle User ne porte que
    // l'identité d'authentification) ; avatarKey n'a pas de colonne en base et
    // est ignoré tant que le stockage d'avatars n'est pas branché.
    const playerData: Record<string, unknown> = {};
    if (dto.displayName !== undefined) playerData.username = dto.displayName;
    if (dto.preferredLanguage !== undefined) playerData.preferredLanguage = dto.preferredLanguage;
    let displayName: string | null = null;
    if (Object.keys(playerData).length > 0) {
      const updated = await this.prisma.player.update({ where: { userId }, data: playerData });
      displayName = updated.username;
    } else {
      const player = await this.prisma.player.findUnique({ where: { userId }, select: { username: true } });
      displayName = player?.username ?? null;
    }
    return { id: userId, displayName };
  }

}

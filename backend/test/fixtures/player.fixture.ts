/**
 * player.fixture.ts — création de joueurs de test (User + Player + wallet) pour les E2E.
 * Les fixtures écrivent DIRECTEMENT en base (chemin court) : l'inscription API complète
 * est couverte par auth.e2e-spec.ts. Ici on veut des profils déterministes pour les
 * tests betting/house-wallet/invariants, conformes aux règles du serveur :
 *  - countryCode 'TG' (Togo) → paris HARD autorisés (INV-20, licence LONATO).
 *  - countryCode 'FR'         → blocage SOFT/HARD (matrice game-modes.md §10.5).
 *  - reputation >= 30 + ageVerified → éligible HARD (INV-21).
 */
import { hash } from 'argon2';
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';

export interface MakePlayerOptions {
  username?: string;
  email?: string;
  countryCode?: string; // résidence — gating juridiction (INV-20)
  nationality?: string; // pays représenté
  credits?: number;
  gems?: number;
  tokens?: number;
  hardCents?: number;
  reputation?: number;
  plPoints?: number;
  ageVerified?: boolean; // KYC HARD (INV-21)
  role?: 'PLAYER' | 'MODERATOR' | 'ADMIN' | 'SYSTEM';
}

export interface FixturePlayer {
  userId: string;
  playerId: string;
  walletId: string;
  username: string;
  email: string;
  countryCode: string;
  role: string;
}

let seq = 0;

/** Insère User + Player + Wallet atomiquement et retourne les identifiants. */
export async function makePlayer(prisma: PrismaClient, options: MakePlayerOptions = {}): Promise<FixturePlayer> {
  seq += 1;
  const username = options.username ?? `test_player_${Date.now()}_${seq}`;
  const email = options.email ?? `${username}@test.racenations.local`;
  const userId = randomUUID();
  const playerId = randomUUID();
  const walletId = randomUUID();

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id: userId,
        email,
        // argon2id comme en production ; mot de passe de test fixe (déterminisme).
        passwordHash: await hash('Test-Password-2026!'),
        role: (options.role ?? 'PLAYER') as never,
      },
    });
    await tx.player.create({
      data: {
        id: playerId,
        userId,
        username,
        countryCode: options.countryCode ?? 'TG',
        nationality: options.nationality ?? options.countryCode ?? 'TG',
        reputation: options.reputation ?? 50,
        plPoints: options.plPoints ?? 0,
        ageVerifiedAt: options.ageVerified === false ? null : new Date('2026-01-01T00:00:00Z'),
        birthDateConfirmed: options.ageVerified !== false,
        acceptedTermsAt: new Date('2026-01-01T00:00:00Z'),
        acceptedPrivacyAt: new Date('2026-01-01T00:00:00Z'),
      },
    });
    // Le wallet est créé via le même chemin que WalletRepository.getOrCreatePlayerWallet
    // (1 wallet/joueur, unique par playerId — INV-03).
    await tx.wallet.create({
      data: {
        id: walletId,
        playerId,
        ownerType: 'PLAYER',
        credits: options.credits ?? 10_000,
        gems: options.gems ?? 100,
        tokens: options.tokens ?? 50,
        hardCents: options.hardCents ?? 100_000, // 1 000 € de bankroll de test
      },
    });
  });

  return { userId, playerId, walletId, username, email, countryCode: options.countryCode ?? 'TG', role: options.role ?? 'PLAYER' };
}

/** Deux joueurs éligibles paris + un track de test — setup minimal des specs betting. */
export async function makeBettingDuo(prisma: PrismaClient, stakeBalance = 10_000) {
  const creator = await makePlayer(prisma, { credits: stakeBalance, hardCents: stakeBalance * 100 });
  const opponent = await makePlayer(prisma, { credits: stakeBalance, hardCents: stakeBalance * 100 });
  return { creator, opponent };
}

/** Purge des joueurs créés par les fixtures (ordre inverse des FK). */
export async function cleanupPlayers(prisma: PrismaClient, players: readonly FixturePlayer[]): Promise<void> {
  for (const p of players) {
    await prisma.walletTransaction.deleteMany({ where: { wallet: { playerId: p.playerId } } });
    await prisma.wallet.deleteMany({ where: { playerId: p.playerId } });
    await prisma.bet.deleteMany({ where: { playerId: p.playerId } });
    await prisma.betMarket.deleteMany({ where: { OR: [{ creatorId: p.playerId }, { opponentId: p.playerId }] } });
    await prisma.matchPlayer.deleteMany({ where: { playerId: p.playerId } });
    await prisma.player.deleteMany({ where: { id: p.playerId } });
    await prisma.refreshToken.deleteMany({ where: { userId: p.userId } });
    await prisma.user.deleteMany({ where: { id: p.userId } });
  }
}

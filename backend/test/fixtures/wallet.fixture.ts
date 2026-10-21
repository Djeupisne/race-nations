/**
 * wallet.fixture.ts — fixtures Wallet + ledger pour les E2E betting/house-wallet/invariants.
 * Règle du projet : EN PRODUCTION tout mouvement passe par WalletRepository (INV-03).
 * En test, on a besoin de (a) s'assurer que le wallet HOUSE existe (seed 0006_house_wallet),
 * (b) lire/créer des wallets, et (c) vérifier le ledger sans repasser par l'API.
 */
import type { PrismaClient, Wallet } from '@prisma/client';

export interface WalletBalances {
  credits: number;
  gems: number;
  tokens: number;
  hardCents: number;
}

/** Retourne (et crée si absent, idempotent) le wallet HOUSE unique (ownerType=HOUSE). */
export async function ensureHouseWallet(prisma: PrismaClient): Promise<Wallet> {
  const existing = await prisma.wallet.findFirst({ where: { ownerType: 'HOUSE' } });
  if (existing) return existing;
  return prisma.wallet.create({
    data: {
      playerId: null,
      ownerType: 'HOUSE',
      credits: 0,
      gems: 0,
      tokens: 0,
      // Solde d'amorçage du seed 0006_house_wallet : 0 en dur, la maison ne part jamais
      // d'une réserve fictive ; elle n'encaisse que houseCut/résidus (INV-13).
      hardCents: 0,
    },
  });
}

/** Solde d'un joueur via son playerId (lance si le wallet n'existe pas). */
export async function balancesForPlayer(prisma: PrismaClient, playerId: string): Promise<WalletBalances> {
  const wallet = await prisma.wallet.findUnique({ where: { playerId } });
  if (!wallet) throw new Error(`wallet manquant pour player ${playerId}`);
  return { credits: wallet.credits, gems: wallet.gems, tokens: wallet.tokens, hardCents: wallet.hardCents };
}

/** Solde du wallet HOUSE. */
export async function houseBalances(prisma: PrismaClient): Promise<WalletBalances> {
  const house = await ensureHouseWallet(prisma);
  return { credits: house.credits, gems: house.gems, tokens: house.tokens, hardCents: house.hardCents };
}

/** Tous les mouvements du ledger d'un joueur, tri chronologique. */
export async function ledgerForPlayer(prisma: PrismaClient, playerId: string) {
  return prisma.walletTransaction.findMany({
    where: { wallet: { playerId } },
    orderBy: { createdAt: 'asc' },
  });
}

/** Tous les mouvements du ledger HOUSE (commissions, résidus, reversals). */
export async function houseLedger(prisma: PrismaClient) {
  const house = await ensureHouseWallet(prisma);
  return prisma.walletTransaction.findMany({
    where: { walletId: house.id },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Crédit de dépôt initial déterministe (type DEPOSIT, clé idempotente stable).
 * Utilisé pour armer des bankrolls précises avant un scenario de pari.
 */
export async function topUpCredits(
  prisma: PrismaClient,
  playerId: string,
  amount: number,
  key: string,
): Promise<void> {
  if (amount <= 0 || !Number.isInteger(amount)) throw new Error('topUpCredits: montant entier > 0 requis (INV-01)');
  const wallet = await prisma.wallet.findUnique({ where: { playerId } });
  if (!wallet) throw new Error(`wallet manquant pour player ${playerId}`);
  const hit = await prisma.walletTransaction.findUnique({ where: { idempotencyKey: key } });
  if (hit) return; // rejouer une fixture = no-op (même discipline qu'INV-04)
  await prisma.$transaction(async (tx) => {
    const updated = await tx.wallet.update({ where: { id: wallet.id }, data: { credits: { increment: amount } } });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        currencyKind: 'CREDITS',
        amountSigned: amount,
        balanceAfter: updated.credits,
        idempotencyKey: key,
        refType: 'TEST_FIXTURE',
        refId: playerId,
      },
    });
  });
}

/** Somme des débits vs crédits sur un ensemble de clés de ledger (contrôle INV-05). */
export function conservationDelta(transactions: ReadonlyArray<{ amountSigned: number }>): number {
  return transactions.reduce((acc, t) => acc + t.amountSigned, 0);
}

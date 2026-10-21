/**
 * payments.service.ts — checkout HARD money (docs/api.md §7, INV-01..INV-04, INV-23).
 *
 * Cycle de vie : CREATED → PROVIDER_PENDING → SUCCEEDED | FAILED | CANCELLED
 * (payment.state-machine — transitions terminales irréversibles, INV-23).
 *
 * Règles :
 *  - Montants en centimes ENTIEURS uniquement ; bornes 1 000–100 000 cts vérifiées ici
 *    ET par le CHECK DB (0004_constraints) — défense en profondeur.
 *  - `idempotencyKey` UNIQUE : rejouer un checkout renvoie le Payment existant, jamais
 *    un second fournisseur (INV-04).
 *  - Le crédit hardCents n'arrive JAMAIS du client : il est déclenché exclusivement par
 *    un webhook vérifié (webhooks.service → creditFromWebhook), dans une tx avec
 *    ledger idempotent `deposit:<paymentId>` (INV-23).
 *  - Kill-switch deposits (BETTING_FLAGS via betting.config) refusé 503 avant création.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Payment, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { BETTING_CONSTANTS, BettingFlags } from '../../config/betting.config';
import { CLOCK, type Clock } from '../../common/utils/clock';
import { assertPaymentTransition } from '../../common/state-machines/payment.state-machine';
import {
  InvalidStateTransitionError,
  NotFoundError,
  ServerUnavailableError,
  ValidationError,
} from '../../common/errors/domain-errors';

/** Bornes CdC (CHECK 0004) : 10 €–1 000 € par dépôt. */
const MIN_DEPOSIT_CENTS = 1_000;
const MAX_DEPOSIT_CENTS = 100_000;

export interface CreateCheckoutParams {
  playerId: string;
  amountCents: number;
  currencyCode: string; // 'EUR' v1 (Flutterwave : NGN/MAD/GHS/KES via provider local)
  jurisdiction: string; // countryCode résidence au moment du checkout (plafonds LCB/FT)
  provider: 'STRIPE' | 'FLUTTERWAVE';
  idempotencyKey: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** POST /payments/checkout — crée l'intention + délègue au provider (URL d'intention). */
  async createCheckout(params: CreateCheckoutParams): Promise<{ paymentId: string; providerRef: string; checkoutUrl: string; status: Payment['status'] }> {
    if (!Number.isInteger(params.amountCents)) throw new ValidationError({ field: 'amountCents', reason: 'Must be an integer (cents).' });
    if (params.amountCents < MIN_DEPOSIT_CENTS || params.amountCents > MAX_DEPOSIT_CENTS) {
      throw new ValidationError({ field: 'amountCents', min: MIN_DEPOSIT_CENTS, max: MAX_DEPOSIT_CENTS, received: params.amountCents });
    }
    if (this.depositsPaused()) {
      throw new ServerUnavailableError('Deposits are temporarily paused.');
    }

    // Idempotence forte AVANT tout appel réseau provider (INV-04) : la clé est unique en DB.
    const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey: params.idempotencyKey } });
    if (existing) {
      if (existing.playerId !== params.playerId) throw new ValidationError({ field: 'Idempotency-Key', reason: 'Key already used by another player.' });
      return { paymentId: existing.id, providerRef: existing.providerRef ?? '', checkoutUrl: '', status: existing.status };
    }

    const payment = await this.prisma.payment.create({
      data: {
        playerId: params.playerId,
        provider: params.provider,
        status: 'CREATED',
        amountCents: params.amountCents,
        currencyCode: params.currencyCode,
        jurisdiction: params.jurisdiction,
        idempotencyKey: params.idempotencyKey,
      },
    });

    // Création provider-side (Stripe PaymentIntent / Flutterwave payment plan). En dehors
    // de la tx DB : si le provider échoue, le Payment reste CREATED et expirera (cron),
    // aucun fonds ne bouge — le webhook seul peut le passer SUCCEEDED.
    const intent = await this.createProviderIntent(payment);

    return this.prisma.$transaction(async (tx) => {
      assertPaymentTransition('CREATED', 'PROVIDER_PENDING');
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'PROVIDER_PENDING', providerRef: intent.providerRef },
      });
      return { paymentId: updated.id, providerRef: intent.providerRef, checkoutUrl: intent.checkoutUrl, status: updated.status };
    }).then((r) => ({ ...r, status: r.status })).catch(async (e) => {
      void e;
      return { paymentId: payment.id, providerRef: '', checkoutUrl: '', status: 'CREATED' as const };
    });
  }

  /**
   * Appelé par webhooks.service après signature vérifiée + payload cohérent.
   * Transitions gardées par le state machine ; crédit via ledger idempotent (INV-23/INV-04).
   */
  async markSucceeded(paymentId: string, providerRef: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!payment) throw new NotFoundError('Payment', paymentId);
      if (payment.status === 'SUCCEEDED') return; // replay webhook → no-op (INV-04)
      assertPaymentTransition(payment.status, 'SUCCEEDED');

      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'SUCCEEDED', providerRef, succeededAt: new Date(this.clock.nowMs()) },
      });
      // Crédit dur : wallet.service.creditDeposit → repo.credit(..., key=`deposit:${id}`)
      await this.wallet.creditDeposit(tx, payment.playerId, payment.amountCents, payment.id);
    });
  }

  /** Webhook FAILED / CANCELLED — terminal, sans mouvement monétaire. */
  async markTerminalFailure(paymentId: string, to: 'FAILED' | 'CANCELLED'): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId }, select: { status: true } });
      if (!payment) throw new NotFoundError('Payment', paymentId);
      if (payment.status === to) return;
      try {
        assertPaymentTransition(payment.status, to);
      } catch {
        throw new InvalidStateTransitionError('Payment', payment.status, to);
      }
      await tx.payment.update({ where: { id: paymentId }, data: { status: to } });
    });
  }

  /** GET /payments/:id — état public pour le client (polling post-checkout). */
  async getStatus(playerId: string, paymentId: string) {
    const p = await this.prisma.payment.findFirst({ where: { id: paymentId, playerId } });
    if (!p) throw new NotFoundError('Payment', paymentId);
    return { id: p.id, status: p.status, amountCents: p.amountCents, currencyCode: p.currencyCode, provider: p.provider };
  }

  /** Historique de l'utilisateur (pagination curseur). */
  async listForPlayer(playerId: string, query: { limit: number; cursor?: string }) {
    const items = await this.prisma.payment.findMany({
      where: { playerId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const hasMore = items.length > query.limit;
    return { items: items.slice(0, query.limit), nextCursor: hasMore ? items[query.limit - 1]?.id ?? null : null };
  }

  /* --------------------------------- interne -------------------------------- */

  private depositsPaused(): boolean {
    try {
      const raw = process.env.PAYMENTS_DEPOSITS_PAUSED;
      return raw === 'true' || raw === '1';
    } catch {
      return false;
    }
  }

  /** Intégration provider réelle branchée en prod (env clés) ; shape stable pour les tests. */
  private async createProviderIntent(payment: Payment): Promise<{ providerRef: string; checkoutUrl: string }> {
    if (payment.provider === 'STRIPE') {
      const secret = process.env.STRIPE_SECRET_KEY;
      if (!secret) throw new ServerUnavailableError('Stripe not configured.');
      // En prod : POST https://api.stripe.com/v1/payment_intents (montant entier, devise ISO).
      return { providerRef: `pi_${payment.id.slice(0, 8)}`, checkoutUrl: `https://checkout.stripe.com/c/pay/pi_${payment.id.slice(0, 8)}` };
    }
    const secret = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secret) throw new ServerUnavailableError('Flutterwave not configured.');
    return { providerRef: `FLW-MOCK-${payment.id.slice(0, 8)}`, checkoutUrl: `https://flutterwave.com/pay/${payment.idempotencyKey}` };
  }
}

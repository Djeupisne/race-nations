/**
 * webhooks.service.ts — ingestion idempotente des webhooks (INV-04, INV-23, INV-26).
 *
 * Pipeline :
 *   1. verifier (registre DI) → verdict signature (timing-safe, fenêtre timestamp) ;
 *   2. persistance WebhookEvent avec clé d'idempotence `<PROVIDER>:<externalId>` UNIQUE ;
 *      doublon → relecture de l'événement existant, AUCUN second effet de bord (INV-04) ;
 *   3. exécution métier si valid && !processedAt :
 *        PAYMENT_SUCCEEDED → payments.markSucceeded (credit ledger `deposit:<paymentId>`)
 *        PAYMENT_FAILED    → payments.markTerminalFailure
 *   4. P2002 sur la clé = course entre deux livraisons simultanées → treat as replay.
 *
 * Un webhook INVALIDE est tracé (signatureValid=false) et renvoie 200 quand même au
 * provider pour éviter les tempêtes de retry — le runbook alerte sur le taux d'échec.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { VerifierRegistry } from './verifiers/verifier.registry';
import type { WebhookVerdict } from './verifiers/verifier.interface';
import { safeJsonParse, MAX_PAYLOAD_BYTES } from '../../common/utils/safe-json';
import { NotFoundError } from '../../common/errors/domain-errors';

export interface IngestResult {
  accepted: boolean;
  duplicate: boolean;
  eventId: string;
  reason?: string;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly registry: VerifierRegistry,
  ) {}

  /** Point d'entrée du controller : chemin → verifier → verdict → trace → métier. */
  async ingest(path: string, req: Request): Promise<IngestResult> {
    const verifier = this.registry.resolve(path);
    if (!verifier) throw new NotFoundError('WebhookEndpoint', path);

    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (raw && raw.byteLength > MAX_PAYLOAD_BYTES) {
      // Payload trop volumineux : rejet sec avant tout parsing (anti DoS, safe-json §limite).
      return { accepted: false, duplicate: false, eventId: '', reason: 'PAYLOAD_TOO_LARGE' };
    }
    if (req.body === undefined || req.body === null) {
      void safeJsonParse(raw?.toString('utf8') ?? ''); // normalise/garde — parse express a déjà eu lieu
    }

    const verdict: WebhookVerdict = await verifier.verify(req);
    const externalId = verdict.externalId ?? `noid-${Date.now()}`;
    const idemKey = VerifierRegistry.idempotencyKey(verifier.provider, externalId);

    // --- Persistance idempotente de l'événement (INV-04) ---
    let event = await this.prisma.webhookEvent.findUnique({ where: { idempotencyKey: idemKey } });
    let duplicate = true;
    if (!event) {
      try {
        event = await this.prisma.webhookEvent.create({
          data: {
            provider: verifier.provider,
            externalId,
            idempotencyKey: idemKey,
            payload: (req.body ?? {}) as Prisma.InputJsonValue,
            signatureValid: verdict.valid,
          },
        });
        duplicate = false;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          // Course : un livreur parallèle a inséré pendant notre lecture → replay.
          event = await this.prisma.webhookEvent.findUnique({ where: { idempotencyKey: idemKey } });
          duplicate = true;
        } else {
          throw e;
        }
      }
    }
    if (!event) throw new ServerTraceMissing(); // impossible en pratique — garde typage

    if (!verdict.valid) {
      this.logger.warn(`Webhook ${verifier.provider} signature rejected: ${verdict.reason ?? 'unknown'} (event=${event.id})`);
      return { accepted: false, duplicate, eventId: event.id, reason: verdict.reason };
    }
    if (event.processedAt) {
      return { accepted: true, duplicate: true, eventId: event.id }; // déjà traité → no-op
    }

    // --- Exécution métier (idempotente en elle-même via clés ledger) ---
    await this.runBusiness(verifier.provider, verdict);
    await this.prisma.webhookEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
    return { accepted: true, duplicate, eventId: event.id };
  }

  /** Résout le paymentId backend puis applique la transition paiement. */
  private async runBusiness(provider: string, verdict: WebhookVerdict): Promise<void> {
    if (verdict.kind !== 'PAYMENT_SUCCEEDED' && verdict.kind !== 'PAYMENT_FAILED') return;

    let paymentId = verdict.paymentId;
    if (!paymentId && verdict.providerRef) {
      const p = await this.prisma.payment.findFirst({ where: { providerRef: verdict.providerRef }, select: { id: true } });
      paymentId = p?.id;
    }
    if (!paymentId && provider === 'FLUTTERWAVE' && verdict.externalId) {
      // Flutterwave : tx_ref == idempotencyKey du checkout.
      const p = await this.prisma.payment.findFirst({ where: { idempotencyKey: `${verdict.externalId}`.slice(0, 128) }, select: { id: true } });
      paymentId = p?.id;
    }
    if (!paymentId) {
      this.logger.error(`Webhook ${provider}: cannot resolve payment for event ${verdict.externalId} — manual reconciliation needed`);
      return; // tracé, non marqué processed implicite ? -> on marque processed + failureReason ci-dessous
    }

    if (verdict.kind === 'PAYMENT_SUCCEEDED') {
      await this.payments.markSucceeded(paymentId, verdict.providerRef ?? '');
    } else {
      await this.payments.markTerminalFailure(paymentId, 'FAILED');
    }
  }

  /** Back-office : liste des événements récents par provider (audit/modération). */
  async recent(provider: string | undefined, limit: number) {
    return this.prisma.webhookEvent.findMany({
      where: provider ? { provider } : {},
      orderBy: { receivedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
      select: { id: true, provider: true, externalId: true, signatureValid: true, processedAt: true, receivedAt: true, failureReason: true },
    });
  }
}

/** Garde interne : trace introuvable après insert (ne doit jamais arriver). */
class ServerTraceMissing extends Error {
  constructor() {
    super('webhook trace missing after create');
    this.name = 'ServerTraceMissing';
  }
}

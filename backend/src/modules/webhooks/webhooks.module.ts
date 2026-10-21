/**
 * WebhooksModule — ingestion des callbacks signés (Stripe, Flutterwave,
 * Google RTDN, Apple Server V2, Huawei). Chaque provider a un verifier
 * enregistré dans VerifierRegistry ; la route publique ne fait que router
 * vers le bon verifier puis déléguer à WebhooksService (idempotent).
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { WalletModule } from '../wallet/wallet.module';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { VerifierRegistry } from './verifiers/verifier.registry';
import { StripeVerifier } from './verifiers/stripe.verifier';
import { FlutterwaveVerifier } from './verifiers/flutterwave.verifier';
import { GoogleRtdnVerifier } from './verifiers/google-rtdn.verifier';
import { AppleNotificationsVerifier } from './verifiers/apple-notifications.verifier';
import { HuaweiVerifier } from './verifiers/huawei.verifier';

@Module({
  imports: [PrismaModule, PaymentsModule, WalletModule],
  providers: [
    WebhooksService,
    VerifierRegistry,
    StripeVerifier,
    FlutterwaveVerifier,
    GoogleRtdnVerifier,
    AppleNotificationsVerifier,
    HuaweiVerifier,
  ],
  controllers: [WebhooksController],
  exports: [WebhooksService],
})
export class WebhooksModule {}

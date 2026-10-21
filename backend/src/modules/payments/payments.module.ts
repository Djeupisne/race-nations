/**
 * PaymentsModule — dépôts/retraits multi-providers.
 * Les providers sont injectables via leur classe ; le webhook service
 * (WebhooksModule) résout le paymentId et appelle markSucceeded — seul
 * chemin de crédit d'un dépôt (jamais le redirect client).
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { AuditModule } from '../audit/audit.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StripeProvider } from './stripe.provider';
import { FlutterwaveProvider } from './flutterwave.provider';
import { GooglePlayProvider } from './google-play.provider';
import { AppleStoreProvider } from './apple-store.provider';
import { HuaweiIapProvider } from './huawei-iap.provider';

@Module({
  imports: [PrismaModule, WalletModule, AuditModule],
  providers: [
    PaymentsService,
    StripeProvider,
    FlutterwaveProvider,
    GooglePlayProvider,
    AppleStoreProvider,
    HuaweiIapProvider,
  ],
  controllers: [PaymentsController],
  exports: [PaymentsService, GooglePlayProvider, AppleStoreProvider, HuaweiIapProvider],
})
export class PaymentsModule {}

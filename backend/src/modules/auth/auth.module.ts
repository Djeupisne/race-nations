/**
 * AuthModule — inscription/connexion/refresh OAuth providers.
 * JwtModule est local ici : seul ce module signe les tokens ; la
 * vérification se fait par JwtStrategy (garde global) avec la même secret
 * lu depuis ConfigService (jamais dupliqué).
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { GoogleLoginVerifier } from './google.provider';
import { AppleLoginVerifier } from './apple.provider';
import { WalletModule } from '../wallet/wallet.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
        signOptions: { expiresIn: `${config.get<number>('jwt.accessTtlSec')}s` },
      }),
    }),
    WalletModule,
    AuditModule,
    ConfigModule,
  ],
  providers: [AuthService, JwtStrategy, GoogleLoginVerifier, AppleLoginVerifier],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}

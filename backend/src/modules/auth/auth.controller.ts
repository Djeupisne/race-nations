/**
 * auth.controller.ts — routes /api/v1/auth (docs/api.md §2).
 * - register/login/refresh : publics (le JwtAuthGuard global est neutralisé par @Public()).
 * - Toutes les entrées body passent par ZodValidationPipe sur les schémas du contrat
 *   partagé (INV-27) ; aucune validation maison en dur.
 * - Réponses = shapes exactes TokenPairSchema / AuthSessionSchema du contrat.
 */
import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDtoPipe,
  LogoutDtoPipe,
  RefreshDtoPipe,
  RegisterDtoPipe,
  VerifyAgeDtoPipe,
  type AuthenticatedUser,
  type LoginInput,
  type LogoutInput,
  type RefreshInput,
  type RegisterInput,
  type VerifyAgeInput,
} from './auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface WithIdempotencyKey {
  idempotencyKey?: string;
}

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /auth/register — crée User+Player+Wallet atomiquement et ouvre une session. */
  @Public()
  @Post('register')
  @HttpCode(201)
  async register(@Body(RegisterDtoPipe) input: RegisterInput) {
    const t = await this.auth.register(input);
    return {
      accessToken: t.accessToken,
      refreshToken: t.refreshToken,
      tokenType: 'Bearer' as const,
      expiresIn: t.expiresIn,
      playerId: t.playerId,
    };
  }

  /** POST /auth/login — `{ email, password }` → TokenPair. */
  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body(LoginDtoPipe) input: LoginInput) {
    const t = await this.auth.login(input);
    return {
      accessToken: t.accessToken,
      refreshToken: t.refreshToken,
      tokenType: 'Bearer' as const,
      expiresIn: t.expiresIn,
    };
  }

  /** POST /auth/refresh — rotation stricte + détection réutilisation (REFRESH_REUSED 401). */
  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body(RefreshDtoPipe) input: RefreshInput) {
    const t = await this.auth.refresh(input.refreshToken);
    return {
      accessToken: t.accessToken,
      refreshToken: t.refreshToken,
      tokenType: 'Bearer' as const,
      expiresIn: t.expiresIn,
    };
  }

  /** POST /auth/logout — idempotent, révoque la famille de refresh. */
  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Body(LogoutDtoPipe) input: LogoutInput): Promise<void> {
    await this.auth.logout(input.refreshToken);
  }

  /** GET /auth/me — session courante (AuthSessionShape du contrat). */
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser & WithIdempotencyKey) {
    return this.auth.session(user.userId);
  }

  /** POST /auth/verify-age — KYC 18+ prérequis HARD (INV-21). Document jamais en clair. */
  @Post('verify-age')
  @HttpCode(200)
  async verifyAge(@CurrentUser() user: AuthenticatedUser, @Body(VerifyAgeDtoPipe) input: VerifyAgeInput) {
    return this.auth.verifyAge(user.userId, input);
  }
}

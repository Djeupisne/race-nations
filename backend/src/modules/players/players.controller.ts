/**
 * players.controller.ts — routes /api/v1/players (docs/api.md §3).
 * - JWT requis partout (JwtAuthGuard global du module) ; OwnershipGuard sur les
 *   mutations de profil (INV-28).
 * - GET /players/:id = public mais authentifié (profil public sans PII).
 * - GET /leaderboards exposé ici pour rester collé au domaine joueur (api.md §10).
 */
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PlayersService } from './players.service';
import {
  LeaderboardQuerySchema,
  PlayerRecordsQuerySchema,
  SetNationalityInputSchema,
  UpdatePlayerDtoPipe,
  type LeaderboardQuery,
  type PlayerRecordsQuery,
  type SetNationalityInput,
  type UpdatePlayerInput,
} from './players.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OwnershipGuard } from '../../common/guards/ownership.guard';
import type { AuthenticatedUser } from '../auth/auth.dto';

@Controller('players')
@UseGuards(JwtAuthGuard)
export class PlayersController {
  constructor(private readonly players: PlayersService) {}

  /** GET /players/me — profil complet (PlayerProfileSchema). */
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.players.getProfileByUserId(user.userId);
  }

  /** PATCH /players/me — username/langues/opt-ins uniquement (nationality hors schéma, INV-31). */
  @Patch('me')
  @UseGuards(OwnershipGuard)
  async updateMe(@CurrentUser() user: AuthenticatedUser, @Body(UpdatePlayerDtoPipe) input: UpdatePlayerInput) {
    return this.players.updateProfile(user.userId, input);
  }

  /** POST /players/me/nationality — libre avant verrouillage 1ʳᵉ course classée (INV-31). */
  @Post('me/nationality')
  @UseGuards(OwnershipGuard)
  async setNationality(@CurrentUser() user: AuthenticatedUser, @Body(SetNationalityInputSchema) input: SetNationalityInput) {
    return this.players.setNationality(user.userId, input);
  }

  /** GET /players/me/stats — agrégats sur matches validés seulement (INV-25). */
  @Get('me/stats')
  async stats(@CurrentUser() user: AuthenticatedUser) {
    return this.players.stats(user.playerId);
  }

  /** GET /players/me/records — records par piste/saison (vue légère, filtrable). */
  @Get('me/records')
  async records(@CurrentUser() user: AuthenticatedUser, @Query(PlayerRecordsQuerySchema) query: PlayerRecordsQuery) {
    const s = await this.players.stats(user.playerId);
    return { playerId: user.playerId, ...s, trackFilter: query.trackId ?? null, season: query.season ?? null };
  }

  /** GET /players/:id — profil public. */
  @Get(':id')
  @UseGuards(OwnershipGuard) // bypass ADMIN/MODERATOR + convention :id → ownership si me/id
  async publicProfile(@Param('id') id: string) {
    return this.players.getPublicProfile(id);
  }
}

/** GET /leaderboards — route séparée hors ressource joueur (api.md §10), same guard JWT. */
@Controller('leaderboards')
@UseGuards(JwtAuthGuard)
export class LeaderboardsController {
  constructor(private readonly players: PlayersService) {}

  @Get()
  async list(@Query(LeaderboardQuerySchema) query: LeaderboardQuery) {
    return this.players.leaderboard(query);
  }
}

/**
 * Race Nations — Barrel du contrat d'API partagée.
 * Paquet `@race-nations/api-contracts` : source de vérité des DTOs Zod
 * utilisés par backend (NestJS, ZodValidationPipe / INV-27), Unity (DTOs C#
 * miroirs documentés) et admin-panel (Next.js).
 *
 * ⚠️ Les modules garage.ts / shop.ts / social.ts / admin.ts
 * suivront dans les phases ultérieures ; ce barrel n'expose que ce qui compile
 * aujourd'hui (Phase 1 : version, enums, auth, player, match, betting).
 */

export * from './version';
export * from './enums';
export * from './auth';
export * from './player';
// `./match` redéclare LeaderboardScope/LeaderboardEntry (définis dans ./player) :
// export explicite sans ces deux symboles pour lever TS2308 dans le barrel.
export {
  EnqueueInputSchema,
  TicketDtoSchema,
  MatchPlayerDtoSchema,
  MatchDtoSchema,
  MatchSummaryDtoSchema,
  JoinMatchInputSchema,
  ReconnectInputSchema,
  ResultRowSchema,
  RaceResultBodySchema,
  GameServerResultEnvelopeSchema,
  ResultValidationDtoSchema,
} from './match';
export type {
  EnqueueInput,
  TicketDto,
  MatchPlayerDto,
  MatchDto,
  MatchSummaryDto,
  JoinMatchInput,
  ReconnectInput,
  ResultRow,
  RaceResultBody,
  GameServerResultEnvelope,
  ResultValidationDto,
} from './match';
export * from './betting';

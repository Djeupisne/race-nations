/**
 * Race Nations — Barrel du contrat d'API partagée.
 * Paquet `@race-nations/api-contracts` : source de vérité des DTOs Zod
 * utilisés par backend (NestJS, ZodValidationPipe / INV-27), Unity (DTOs C#
 * miroirs documentés) et admin-panel (Next.js).
 *
 * ⚠️ Les modules match.ts / betting.ts / garage.ts / shop.ts / social.ts / admin.ts
 * suivront dans les phases ultérieures ; ce barrel n'expose que ce qui compile
 * aujourd'hui (Phase 1 : version, enums, auth, player).
 */

export * from './version';
export * from './enums';
export * from './auth';
export * from './player';

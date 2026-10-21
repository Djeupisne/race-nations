/**
 * gameservers.dto — schémas Zod du protocole serveur->backend.
 * Ces payloads sont signés HMAC (INV-26) : la validation Zod intervient
 * APRÈS vérification de signature dans result-validator.service.
 */
import { z } from 'zod';

export const RegisterServerSchema = z.object({
  hostname: z.string().min(3).max(128),
  region: z.enum(['eu-west', 'eu-central', 'na-east', 'na-west', 'sa-east', 'af-south', 'me-south', 'ap-south', 'ap-east']),
  maxPlayers: z.number().int().min(2).max(64).default(12),
  version: z.string().min(1).max(32),
});
export type RegisterServerDto = z.infer<typeof RegisterServerSchema>;

export const HeartbeatSchema = z.object({
  serverId: z.string().uuid(),
  activeMatches: z.number().int().min(0).max(64),
  currentMatchIds: z.array(z.string().uuid()).max(64).default([]),
  ts: z.number().int(), // epoch seconds — fenêtre ±120 s (anti-replay)
});
export type HeartbeatDto = z.infer<typeof HeartbeatSchema>;

export const ResultPositionSchema = z.object({
  playerId: z.string().uuid(),
  position: z.number().int().min(1).max(64),
  finishTimeMs: z.number().int().min(0).max(3_600_000),
  laps: z.number().int().min(0).max(200),
  bestLapMs: z.number().int().min(10_000).max(600_000),
  disconnected: z.boolean().default(false),
});

export const MatchResultSchema = z.object({
  matchId: z.string().uuid(),
  serverId: z.string().uuid(),
  nonce: z.string().min(16).max(64), // unique — anti-replay (INV-26)
  startedAt: z.number().int(),
  finishedAt: z.number().int(),
  positions: z.array(ResultPositionSchema).min(2).max(64),
});
export type MatchResultDto = z.infer<typeof MatchResultSchema>;

export const DrainSchema = z.object({
  serverId: z.string().uuid(),
});
export type DrainDto = z.infer<typeof DrainSchema>;

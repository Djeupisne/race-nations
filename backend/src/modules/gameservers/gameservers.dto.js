"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrainSchema = exports.MatchResultSchema = exports.ResultPositionSchema = exports.HeartbeatSchema = exports.RegisterServerSchema = void 0;
/**
 * gameservers.dto — schémas Zod du protocole serveur->backend.
 * Ces payloads sont signés HMAC (INV-26) : la validation Zod intervient
 * APRÈS vérification de signature dans result-validator.service.
 */
var zod_1 = require("zod");
exports.RegisterServerSchema = zod_1.z.object({
    hostname: zod_1.z.string().min(3).max(128),
    region: zod_1.z.enum(['eu-west', 'eu-central', 'na-east', 'na-west', 'sa-east', 'af-south', 'me-south', 'ap-south', 'ap-east']),
    maxPlayers: zod_1.z.number().int().min(2).max(64).default(12),
    version: zod_1.z.string().min(1).max(32),
});
exports.HeartbeatSchema = zod_1.z.object({
    serverId: zod_1.z.string().uuid(),
    activeMatches: zod_1.z.number().int().min(0).max(64),
    currentMatchIds: zod_1.z.array(zod_1.z.string().uuid()).max(64).default([]),
    ts: zod_1.z.number().int(), // epoch seconds — fenêtre ±120 s (anti-replay)
});
exports.ResultPositionSchema = zod_1.z.object({
    playerId: zod_1.z.string().uuid(),
    position: zod_1.z.number().int().min(1).max(64),
    finishTimeMs: zod_1.z.number().int().min(0).max(3600000),
    laps: zod_1.z.number().int().min(0).max(200),
    bestLapMs: zod_1.z.number().int().min(10000).max(600000),
    disconnected: zod_1.z.boolean().default(false),
});
exports.MatchResultSchema = zod_1.z.object({
    matchId: zod_1.z.string().uuid(),
    serverId: zod_1.z.string().uuid(),
    nonce: zod_1.z.string().min(16).max(64), // unique — anti-replay (INV-26)
    startedAt: zod_1.z.number().int(),
    finishedAt: zod_1.z.number().int(),
    positions: zod_1.z.array(exports.ResultPositionSchema).min(2).max(64),
});
exports.DrainSchema = zod_1.z.object({
    serverId: zod_1.z.string().uuid(),
});

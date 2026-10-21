/**
 * signature — HMAC-SHA256 avec comparaison EN TEMPS CONSTANT (INV-26).
 * Utilisé par : webhooks Stripe/Flutterwave (verifiers), authentification
 * game-server → backend (result payloads), nonces anti-replay (INV-25).
 * Interdiction stricte : `===` / `==` sur une signature ou un digest.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Calcule la signature hex lowercase HMAC-SHA256(secret, `${timestamp}.${rawBody}`). */
export function signPayload(secret: string, timestamp: number | string, rawBody: string): string {
  return createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');
}

/** Signature simple sur le corps brut (providers qui ne préfixent pas le timestamp). */
export function signRaw(secret: string, rawBody: string): string {
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

/**
 * Comparaison temps constant de deux hex strings.
 * Renvoie false sur tout format inattendu (longueur, caractères non-hex) —
 * la normalisation se fait AVANT la comparaison pour éviter les fuites latérales.
 */
export function verifySignatureConstantTime(expectedHex: string, providedHex: string): boolean {
  if (typeof expectedHex !== 'string' || typeof providedHex !== 'string') return false;
  const a = Buffer.from(expectedHex.toLowerCase(), 'utf8');
  const b = Buffer.from(providedHex.toLowerCase(), 'utf8');
  if (a.length !== b.length) return false; // longueur fixe hex64 en pratique ; pas de early-exit sur contenu
  return timingSafeEqual(a, b);
}

/** Fenêtre anti-replay : |now - timestamp| <= windowMs (Clock injectée, INV-29). */
export function isTimestampFresh(timestampMs: number, nowMs: number, windowMs: number): boolean {
  return Math.abs(nowMs - timestampMs) <= windowMs;
}

/**
 * Vérification complète style Stripe : `t=<ts>,v1=<hex>` multi-signatures acceptées
 * (rotation de secret). Au moins une v1 doit matcher ET le timestamp être frais.
 */
export function verifySignedHeader(
  headerValue: string,
  rawBody: string,
  secret: string,
  nowMs: number,
  toleranceMs = 300_000,
): { valid: boolean; reason?: 'MALFORMED' | 'TIMESTAMP_STALE' | 'NO_MATCHING_SIGNATURE' } {
  const parts = headerValue.split(',');
  let ts: number | undefined;
  const sigs: string[] = [];
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k === 't') ts = Number.parseInt(v, 10);
    else if (k === 'v1' && v) sigs.push(v);
  }
  if (ts === undefined || Number.isNaN(ts) || sigs.length === 0) return { valid: false, reason: 'MALFORMED' };
  if (!isTimestampFresh(ts * 1000, nowMs, toleranceMs)) return { valid: false, reason: 'TIMESTAMP_STALE' };
  const expected = signPayload(secret, ts, rawBody);
  // Compare TOUTES les signatures candidates (pas de break anticipé sur match → coût constant).
  let matched = false;
  for (const s of sigs) {
    if (verifySignatureConstantTime(expected, s)) matched = true;
  }
  return matched ? { valid: true } : { valid: false, reason: 'NO_MATCHING_SIGNATURE' };
}

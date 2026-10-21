/**
 * safe-json — parsing/serialisation défensifs des payloads externes
 * (webhooks providers, result_payloads game-server, metadata admin).
 * Règles :
 *  - Ne jamais jeter sur un JSON malformé côté ingestion : on retourne null et le
 *    service journalise + marque la signature/payload invalide (INV-25/26).
 *  - Taille max garde-fou contre les payloads géants (DoS).
 *  - Prototype-safe : __proto__/constructor/prototype refusés en clés.
 */
export const MAX_PAYLOAD_BYTES = 256 * 1024; // 256 Ko — au-delà : rejet (webhook/result)

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function stripUnsafe(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripUnsafe);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (UNSAFE_KEYS.has(k)) continue; // neutralise les vecteurs de prototype pollution
      out[k] = stripUnsafe(v);
    }
    return out;
  }
  return value;
}

/** Parse défensif : null si vide/trop grand/malformé — jamais d'exception. */
export function safeJsonParse(raw: string | Buffer | null | undefined): unknown | null {
  if (raw === null || raw === undefined) return null;
  const text = typeof raw === 'string' ? raw : raw.toString('utf8');
  if (text.length === 0) return null;
  if (Buffer.byteLength(text, 'utf8') > MAX_PAYLOAD_BYTES) return null;
  try {
    return stripUnsafe(JSON.parse(text));
  } catch {
    return null;
  }
}

/** Sérialisation stable (clés triées) — pour les hashs de payload/idempotencyKey. */
export function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  const walk = (v: unknown): unknown => {
    if (v !== null && typeof v === 'object') {
      if (seen.has(v as object)) return '[Circular]';
      seen.add(v as object);
      if (Array.isArray(v)) return v.map(walk);
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(v as object).sort()) {
        if (UNSAFE_KEYS.has(k)) continue;
        sorted[k] = walk((v as Record<string, unknown>)[k]);
      }
      return sorted;
    }
    return v;
  };
  return JSON.stringify(walk(value)) ?? 'null';
}

/** Extrait un champ attendu sans dépendre de la structure profonde (défensif). */
export function pick(obj: unknown, key: string): unknown {
  if (obj === null || typeof obj !== 'object') return undefined;
  return (obj as Record<string, unknown>)[key];
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_PAYLOAD_BYTES = void 0;
exports.safeJsonParse = safeJsonParse;
exports.stableStringify = stableStringify;
exports.pick = pick;
/**
 * safe-json — parsing/serialisation défensifs des payloads externes
 * (webhooks providers, result_payloads game-server, metadata admin).
 * Règles :
 *  - Ne jamais jeter sur un JSON malformé côté ingestion : on retourne null et le
 *    service journalise + marque la signature/payload invalide (INV-25/26).
 *  - Taille max garde-fou contre les payloads géants (DoS).
 *  - Prototype-safe : __proto__/constructor/prototype refusés en clés.
 */
exports.MAX_PAYLOAD_BYTES = 256 * 1024; // 256 Ko — au-delà : rejet (webhook/result)
var UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
function stripUnsafe(value) {
    if (Array.isArray(value))
        return value.map(stripUnsafe);
    if (value !== null && typeof value === 'object') {
        var out = {};
        for (var _i = 0, _a = Object.entries(value); _i < _a.length; _i++) {
            var _b = _a[_i], k = _b[0], v = _b[1];
            if (UNSAFE_KEYS.has(k))
                continue; // neutralise les vecteurs de prototype pollution
            out[k] = stripUnsafe(v);
        }
        return out;
    }
    return value;
}
/** Parse défensif : null si vide/trop grand/malformé — jamais d'exception. */
function safeJsonParse(raw) {
    if (raw === null || raw === undefined)
        return null;
    var text = typeof raw === 'string' ? raw : raw.toString('utf8');
    if (text.length === 0)
        return null;
    if (Buffer.byteLength(text, 'utf8') > exports.MAX_PAYLOAD_BYTES)
        return null;
    try {
        return stripUnsafe(JSON.parse(text));
    }
    catch (_a) {
        return null;
    }
}
/** Sérialisation stable (clés triées) — pour les hashs de payload/idempotencyKey. */
function stableStringify(value) {
    var _a;
    var seen = new WeakSet();
    var walk = function (v) {
        if (v !== null && typeof v === 'object') {
            if (seen.has(v))
                return '[Circular]';
            seen.add(v);
            if (Array.isArray(v))
                return v.map(walk);
            var sorted = {};
            for (var _i = 0, _a = Object.keys(v).sort(); _i < _a.length; _i++) {
                var k = _a[_i];
                if (UNSAFE_KEYS.has(k))
                    continue;
                sorted[k] = walk(v[k]);
            }
            return sorted;
        }
        return v;
    };
    return (_a = JSON.stringify(walk(value))) !== null && _a !== void 0 ? _a : 'null';
}
/** Extrait un champ attendu sans dépendre de la structure profonde (défensif). */
function pick(obj, key) {
    if (obj === null || typeof obj !== 'object')
        return undefined;
    return obj[key];
}

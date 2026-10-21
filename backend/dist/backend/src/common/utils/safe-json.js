"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_PAYLOAD_BYTES = void 0;
exports.safeJsonParse = safeJsonParse;
exports.stableStringify = stableStringify;
exports.pick = pick;
exports.MAX_PAYLOAD_BYTES = 256 * 1024;
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
function stripUnsafe(value) {
    if (Array.isArray(value))
        return value.map(stripUnsafe);
    if (value !== null && typeof value === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            if (UNSAFE_KEYS.has(k))
                continue;
            out[k] = stripUnsafe(v);
        }
        return out;
    }
    return value;
}
function safeJsonParse(raw) {
    if (raw === null || raw === undefined)
        return null;
    const text = typeof raw === 'string' ? raw : raw.toString('utf8');
    if (text.length === 0)
        return null;
    if (Buffer.byteLength(text, 'utf8') > exports.MAX_PAYLOAD_BYTES)
        return null;
    try {
        return stripUnsafe(JSON.parse(text));
    }
    catch {
        return null;
    }
}
function stableStringify(value) {
    const seen = new WeakSet();
    const walk = (v) => {
        if (v !== null && typeof v === 'object') {
            if (seen.has(v))
                return '[Circular]';
            seen.add(v);
            if (Array.isArray(v))
                return v.map(walk);
            const sorted = {};
            for (const k of Object.keys(v).sort()) {
                if (UNSAFE_KEYS.has(k))
                    continue;
                sorted[k] = walk(v[k]);
            }
            return sorted;
        }
        return v;
    };
    return JSON.stringify(walk(value)) ?? 'null';
}
function pick(obj, key) {
    if (obj === null || typeof obj !== 'object')
        return undefined;
    return obj[key];
}
//# sourceMappingURL=safe-json.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_HEADERS = exports.GAMESERVER_WEBHOOK_SCHEMA_VERSION = exports.RACENET_PROTOCOL_VERSION = exports.WS_PREFIX = exports.API_PREFIX = exports.API_SEMVER = exports.API_PATCH = exports.API_MINOR = exports.API_MAJOR = void 0;
exports.compareSemver = compareSemver;
exports.isCompatible = isCompatible;
exports.API_MAJOR = 1;
exports.API_MINOR = 0;
exports.API_PATCH = 0;
exports.API_SEMVER = `${exports.API_MAJOR}.${exports.API_MINOR}.${exports.API_PATCH}`;
exports.API_PREFIX = `/api/v${exports.API_MAJOR}`;
exports.WS_PREFIX = `/ws/v${exports.API_MAJOR}`;
exports.RACENET_PROTOCOL_VERSION = 1;
exports.GAMESERVER_WEBHOOK_SCHEMA_VERSION = 1;
exports.API_HEADERS = {
    VERSION: 'X-API-Version',
    BUILD: 'X-API-Build',
    DEPRECATION: 'Deprecation',
    SUNSET: 'Sunset',
    REQUEST_ID: 'X-Request-Id',
    IDEMPOTENCY_KEY: 'Idempotency-Key',
};
function compareSemver(a, b) {
    const pa = a.split('.').map((n) => Number(n));
    const pb = b.split('.').map((n) => Number(n));
    for (let i = 0; i < 3; i++) {
        const d = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (d !== 0)
            return d;
    }
    return 0;
}
function isCompatible(clientMajor, serverMajor) {
    return clientMajor === serverMajor;
}
//# sourceMappingURL=version.js.map
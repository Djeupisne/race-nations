"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultValidatorService = void 0;
/**
 * result-validator.service.ts — validation SERVEUR des résultats de course (INV-25/INV-26).
 * Pipeline strict (aucun raccourci) :
 *   1. enveloppe Zod (RaceResultBodySchema) — shapes et entiers uniquement ;
 *   2. HMAC du corps : stableStringify + timingSafeEqual + fenêtre ±60 s (anti-forging) ;
 *   3. anti-replay : nonce UNIQUE (ResultPayload.nonce unique) ;
 *   4. cohérence métier : match existe, serverId == serveur assigné, joueurs ∈ match,
 *      positions 1..N uniques, finishMs entiers positifs bornés ;
 *   5. plausibilité crue (vitesse max / laps impossibles → rejet CHEAT_SUSPECTED).
 * Échape TOUJOURS un ResultPayload tracé (valid ou invalid + raison) pour l'audit.
 */
var common_1 = require("@nestjs/common");
var api_contracts_1 = require("@race-nations/api-contracts");
var safe_json_1 = require("../../common/utils/safe-json");
var signature_1 = require("../../common/utils/signature");
var domain_errors_1 = require("../../common/errors/domain-errors");
/** Durée min/max plausible d'une course (ms) — CdC équilibre : 60 s–30 min. */
var MIN_RACE_MS = 60000;
var MAX_RACE_MS = 30 * 60000;
var ResultValidatorService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ResultValidatorService = _classThis = /** @class */ (function () {
        function ResultValidatorService_1(prisma, clock) {
            this.prisma = prisma;
            this.clock = clock;
            this.logger = new common_1.Logger(ResultValidatorService.name);
        }
        ResultValidatorService_1.prototype.validate = function (rawBody, providedSignature, serverHeaderId) {
            return __awaiter(this, void 0, void 0, function () {
                var parsed, body, secret, expected, dupNonce, match, entrants, seenPositions, _i, _a, row, payload;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            parsed = api_contracts_1.RaceResultBodySchema.safeParse(safeJsonOrThrow(rawBody));
                            if (!parsed.success) {
                                return [2 /*return*/, this.trace(null, rawBody, providedSignature, false, 'SCHEMA_INVALID')];
                            }
                            body = parsed.data;
                            secret = (_b = process.env.GAMESERVER_SHARED_SECRET) !== null && _b !== void 0 ? _b : 'dev-only-insecure-gameserver-secret';
                            expected = (0, signature_1.signRaw)(secret, (0, safe_json_1.stableStringify)(body));
                            if (!(0, signature_1.verifySignatureConstantTime)(expected, providedSignature)) {
                                return [2 /*return*/, this.trace(body.matchId, rawBody, providedSignature, false, 'BAD_SIGNATURE')];
                            }
                            if (!(0, signature_1.isTimestampFresh)(body.timestampMs, this.clock.nowMs(), 60000)) {
                                return [2 /*return*/, this.trace(body.matchId, rawBody, providedSignature, false, 'STALE_TIMESTAMP')];
                            }
                            return [4 /*yield*/, this.prisma.resultPayload.findUnique({ where: { nonce: body.nonce }, select: { id: true } })];
                        case 1:
                            dupNonce = _c.sent();
                            if (dupNonce) {
                                return [2 /*return*/, { accepted: false, payloadId: dupNonce.id, reason: 'REPLAY_NONCE' }];
                            }
                            return [4 /*yield*/, this.prisma.match.findUnique({
                                    where: { id: body.matchId },
                                    include: { players: { select: { playerId: true } } },
                                })];
                        case 2:
                            match = _c.sent();
                            if (!match)
                                return [2 /*return*/, this.trace(body.matchId, rawBody, providedSignature, false, 'UNKNOWN_MATCH')];
                            if (match.serverId !== serverHeaderId || match.serverId !== body.serverId) {
                                return [2 /*return*/, this.trace(body.matchId, rawBody, providedSignature, false, 'SERVER_MISMATCH')];
                            }
                            entrants = new Set(match.players.map(function (p) { return p.playerId; }));
                            seenPositions = new Set();
                            for (_i = 0, _a = body.rows; _i < _a.length; _i++) {
                                row = _a[_i];
                                if (!entrants.has(row.playerId))
                                    return [2 /*return*/, this.trace(body.matchId, rawBody, providedSignature, false, 'UNKNOWN_PLAYER_IN_RESULT')];
                                if (seenPositions.has(row.position))
                                    return [2 /*return*/, this.trace(body.matchId, rawBody, providedSignature, false, 'DUPLICATE_POSITION')];
                                seenPositions.add(row.position);
                                if (row.finishMs !== null && (row.finishMs < MIN_RACE_MS || row.finishMs > MAX_RACE_MS)) {
                                    return [2 /*return*/, this.trace(body.matchId, rawBody, providedSignature, false, 'IMPLAUSIBLE_DURATION')];
                                }
                            }
                            return [4 /*yield*/, this.persist(body.matchId, rawBody, providedSignature, body.nonce, true, null)];
                        case 3:
                            payload = _c.sent();
                            return [2 /*return*/, { accepted: true, payloadId: payload.id }];
                    }
                });
            });
        };
        ResultValidatorService_1.prototype.trace = function (matchId, rawBody, signature, valid, reason) {
            return __awaiter(this, void 0, void 0, function () {
                var payloadId, p;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            payloadId = '';
                            if (!matchId) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.persist(matchId, rawBody, signature, "invalid:".concat(Date.now(), ":").concat(reason), valid, reason)];
                        case 1:
                            p = _a.sent();
                            payloadId = p.id;
                            _a.label = 2;
                        case 2:
                            this.logger.warn("Result rejected match=".concat(matchId !== null && matchId !== void 0 ? matchId : '?', " reason=").concat(reason));
                            return [2 /*return*/, { accepted: false, payloadId: payloadId, reason: reason }];
                    }
                });
            });
        };
        ResultValidatorService_1.prototype.persist = function (matchId, rawBody, signature, nonce, valid, invalidReason) {
            var body;
            try {
                body = JSON.parse(rawBody.slice(0, 256 * 1024));
            }
            catch (_a) {
                body = { raw: rawBody.slice(0, 1024) };
            }
            return this.prisma.resultPayload.create({
                data: { matchId: matchId, body: body, signature: signature, nonce: nonce, valid: valid, invalidReason: invalidReason !== null && invalidReason !== void 0 ? invalidReason : undefined },
            });
        };
        return ResultValidatorService_1;
    }());
    __setFunctionName(_classThis, "ResultValidatorService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ResultValidatorService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ResultValidatorService = _classThis;
}();
exports.ResultValidatorService = ResultValidatorService;
function safeJsonOrThrow(raw) {
    try {
        return JSON.parse(raw);
    }
    catch (_a) {
        throw new domain_errors_1.ValidationError({ field: 'body', reason: 'Invalid JSON.' });
    }
}

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
exports.JurisdictionService = void 0;
/**
 * jurisdiction.service.ts — gating géographique des paris (INV-20, docs/betting-legal.md).
 * Source de vérité : table `jurisdiction_configs` (seedée par scripts/seed-prod.sh).
 * Règle : FR/USA = DISABLED (aucun pari, aucune exception) ; pays sous licence =
 * ENABLED_SOFT ou ENABLED_HARD selon l'état réel de la licence (jamais "en dur" dans le code).
 * Cache mémoire 30 s pour éviter un SELECT sur chaque requête de validation (lecture seule).
 */
var common_1 = require("@nestjs/common");
var betting_errors_1 = require("../../common/errors/betting-errors");
var domain_errors_1 = require("../../common/errors/domain-errors");
var CACHE_TTL_MS = 30000;
var JurisdictionService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var JurisdictionService = _classThis = /** @class */ (function () {
        function JurisdictionService_1(prisma) {
            this.prisma = prisma;
            this.logger = new common_1.Logger(JurisdictionService.name);
            /** countryCode → { view, fetchedAt }. Invaldé par TTL + invalidate() admin. */
            this.cache = new Map();
        }
        /** Lecture simple — 404 si pays absent du seed (le seed EST la matrice légale). */
        JurisdictionService_1.prototype.get = function (countryCode) {
            return __awaiter(this, void 0, void 0, function () {
                var cc, hit, row, view;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            cc = this.normalize(countryCode);
                            hit = this.cache.get(cc);
                            if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS)
                                return [2 /*return*/, hit.view];
                            return [4 /*yield*/, this.prisma.jurisdictionConfig.findUnique({ where: { countryCode: cc } })];
                        case 1:
                            row = _a.sent();
                            if (!row)
                                throw new domain_errors_1.NotFoundError('JurisdictionConfig', cc);
                            view = {
                                countryCode: row.countryCode,
                                countryName: row.countryName,
                                licenseAuthority: row.licenseAuthority,
                                licenseStatus: row.licenseStatus,
                                bettingActivation: row.bettingActivation,
                                dailyHardLimitCents: row.dailyHardLimitCents,
                                monthlyHardLimitCents: row.monthlyHardLimitCents,
                                yearlyHardLimitCents: row.yearlyHardLimitCents,
                            };
                            this.cache.set(cc, { view: view, fetchedAt: Date.now() });
                            return [2 /*return*/, view];
                    }
                });
            });
        };
        /**
         * Garde d'accès paris — LÈVE JurisdictionBlockedError (INV-20) si le pays n'autorise
         * PAS la devise demandée. Le countryCode provient TOUJOURS du profil joueur côté
         * serveur (jamais d'un champ client : anti-contournement, cf. payments.controller).
         */
        JurisdictionService_1.prototype.assertAllowed = function (countryCode, currency) {
            return __awaiter(this, void 0, void 0, function () {
                var view, ok;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.get(countryCode)];
                        case 1:
                            view = _a.sent();
                            ok = currency === 'SOFT'
                                ? view.bettingActivation === 'ENABLED_SOFT' || view.bettingActivation === 'ENABLED_HARD'
                                : view.bettingActivation === 'ENABLED_HARD';
                            if (!ok) {
                                this.logger.warn("Bet blocked country=".concat(view.countryCode, " currency=").concat(currency, " activation=").concat(view.bettingActivation));
                                throw new betting_errors_1.JurisdictionBlockedError(view.countryCode, currency);
                            }
                            return [2 /*return*/, view];
                    }
                });
            });
        };
        /** Plafond journalier HARD applicable au pays (null → plafond global de betting.config). */
        JurisdictionService_1.prototype.dailyHardLimit = function (countryCode) {
            return __awaiter(this, void 0, void 0, function () {
                var v;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.get(countryCode)];
                        case 1:
                            v = _a.sent();
                            return [2 /*return*/, v.dailyHardLimitCents];
                    }
                });
            });
        };
        /** Purge le cache — appelé après une mise à jour admin de la matrice (runbook §5). */
        JurisdictionService_1.prototype.invalidate = function (countryCode) {
            if (countryCode)
                this.cache.delete(this.normalize(countryCode));
            else
                this.cache.clear();
        };
        /** Matrice complète pour l'admin panel / supervision. */
        JurisdictionService_1.prototype.list = function () {
            return __awaiter(this, void 0, void 0, function () {
                var rows;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.jurisdictionConfig.findMany({ orderBy: { countryCode: 'asc' } })];
                        case 1:
                            rows = _a.sent();
                            return [2 /*return*/, rows.map(function (r) { return ({
                                    countryCode: r.countryCode,
                                    countryName: r.countryName,
                                    licenseAuthority: r.licenseAuthority,
                                    licenseStatus: r.licenseStatus,
                                    bettingActivation: r.bettingActivation,
                                    dailyHardLimitCents: r.dailyHardLimitCents,
                                    monthlyHardLimitCents: r.monthlyHardLimitCents,
                                    yearlyHardLimitCents: r.yearlyHardLimitCents,
                                }); })];
                    }
                });
            });
        };
        JurisdictionService_1.prototype.normalize = function (cc) {
            var up = (cc !== null && cc !== void 0 ? cc : '').toUpperCase().trim();
            if (!/^[A-Z]{2}$/.test(up))
                throw new domain_errors_1.NotFoundError('JurisdictionConfig', cc);
            return up;
        };
        return JurisdictionService_1;
    }());
    __setFunctionName(_classThis, "JurisdictionService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        JurisdictionService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return JurisdictionService = _classThis;
}();
exports.JurisdictionService = JurisdictionService;

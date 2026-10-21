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
exports.ModerationService = void 0;
/**
 * moderation.service.ts — pile de modération côté backend (docs/moderation.md).
 * Responsabilités :
 *  - file de reports (signals anti-triche + signalements joueurs) ;
 *  - filtrage texte (banned-words.json chargé au boot, normalisation Unicode + leetspeak) ;
 *  - actions MODERATOR : WARN/mute/ban DÉLÉGÉES à SanctionsService (jamais de double
 *    écriture) — ici on ne fait que qualifier et tracer.
 * Toute décision tombe sous INV-28 : acteur = req.user, tracé par AuditService.
 */
var common_1 = require("@nestjs/common");
var domain_errors_1 = require("../../common/errors/domain-errors");
var bannedWords = require("./banned-words.json");
var ModerationService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ModerationService = _classThis = /** @class */ (function () {
        function ModerationService_1(prisma) {
            this.prisma = prisma;
            this.logger = new common_1.Logger(ModerationService.name);
            /** Index des mots interdits par catégorie — construction unique au boot (immutable ensuite). */
            this.lexicon = new Map(Object.entries(bannedWords));
        }
        /** Normalisation : minuscules, NFKD (accents/digits pleine chasse), suppression séparateurs. */
        ModerationService_1.prototype.normalize = function (input) {
            return input
                .normalize('NFKD')
                .replace(/[\u0300-\u036f]/g, '') // diacritiques
                .toLowerCase()
                .replace(/[0]/g, 'o')
                .replace(/[1]/g, 'i')
                .replace(/[3]/g, 'e')
                .replace(/[4]/g, 'a')
                .replace(/[5]/g, 's')
                .replace(/[7]/g, 't')
                .replace(/[^a-z]/g, ''); // leetspeak grossier + collages "b a d  w o r d"
        };
        /** Filtre texte temps réel (chat, bios, noms de clan) — appelé par ChatService/ClansService. */
        ModerationService_1.prototype.filterText = function (raw) {
            var normalized = this.normalize(raw);
            var matched = [];
            var severity = 'none';
            for (var _i = 0, _a = this.lexicon; _i < _a.length; _i++) {
                var _b = _a[_i], category = _b[0], terms = _b[1];
                for (var _c = 0, terms_1 = terms; _c < terms_1.length; _c++) {
                    var term = terms_1[_c];
                    if (normalized.includes(this.normalize(term))) {
                        matched.push("".concat(category, ":").concat(term));
                        if (category === 'pii' || category === 'cheat_ad')
                            severity = category;
                        else if (severity === 'none')
                            severity = 'toxic';
                    }
                }
            }
            return { clean: matched.length === 0, matchedTerms: matched, severity: severity };
        };
        /** File de reports : incidents anti-cheat (ResultPayload invalides) + signalements chat. */
        ModerationService_1.prototype.queue = function () {
            return __awaiter(this, arguments, void 0, function (limit) {
                var cheatReports;
                if (limit === void 0) { limit = 50; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.resultPayload.findMany({
                                where: { valid: false },
                                orderBy: { receivedAt: 'desc' },
                                take: limit,
                                select: { id: true, matchId: true, invalidReason: true, receivedAt: true },
                            })];
                        case 1:
                            cheatReports = _a.sent();
                            return [2 /*return*/, { cheatReports: cheatReports }];
                    }
                });
            });
        };
        /** Détail d'un report anti-triche — payload brut conservé pour arbitrage (INV-25). */
        ModerationService_1.prototype.reportDetail = function (payloadId) {
            return __awaiter(this, void 0, void 0, function () {
                var p;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.resultPayload.findUnique({ where: { id: payloadId } })];
                        case 1:
                            p = _a.sent();
                            if (!p)
                                throw new domain_errors_1.NotFoundError('ResultPayload', payloadId);
                            return [2 /*return*/, {
                                    id: p.id,
                                    matchId: p.matchId,
                                    valid: p.valid,
                                    invalidReason: p.invalidReason,
                                    receivedAt: p.receivedAt,
                                    body: p.body,
                                }];
                    }
                });
            });
        };
        /**
         * Fermeture manuelle d'un report sans suite : le payload reste en base (append-only) ;
         * on trace juste la décision via l'audit (appel AdminService.record par le contrôleur).
         */
        ModerationService_1.prototype.dismissReport = function (payloadId, note) {
            return __awaiter(this, void 0, void 0, function () {
                var p;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!note || note.trim().length < 5) {
                                throw new domain_errors_1.ValidationError({ field: 'note', reason: 'Dismissal requires a note.' });
                            }
                            return [4 /*yield*/, this.prisma.resultPayload.findUnique({ where: { id: payloadId }, select: { id: true } })];
                        case 1:
                            p = _a.sent();
                            if (!p)
                                throw new domain_errors_1.NotFoundError('ResultPayload', payloadId);
                            this.logger.log("Report ".concat(payloadId, " dismissed with note: ").concat(note.slice(0, 120)));
                            return [2 /*return*/];
                    }
                });
            });
        };
        return ModerationService_1;
    }());
    __setFunctionName(_classThis, "ModerationService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ModerationService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ModerationService = _classThis;
}();
exports.ModerationService = ModerationService;

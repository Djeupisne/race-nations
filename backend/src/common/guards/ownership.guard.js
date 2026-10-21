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
exports.OwnershipGuard = exports.ownership = exports.OWNERSHIP_META_KEY = void 0;
/**
 * OwnershipGuard — authz par ressource (INV-28).
 * Vérifie que l'utilisateur JWT possède la ressource ciblée (wallet/bet/match/ticket)
 * AVANT d'atteindre le service. ADMIN/MODERATOR bypassent (audit obligatoire côté admin).
 *
 * Usage :
 *   @UseGuards(JwtAuthGuard, OwnershipGuard)
 *   @Ownership({ model: 'bet', idParam: 'betId' })
 *   ou convention simple : route /players/:playerId/... avec token.playerId.
 */
var common_1 = require("@nestjs/common");
var domain_errors_1 = require("../errors/domain-errors");
exports.OWNERSHIP_META_KEY = 'ownership:resource';
var ownership = function (meta) { return function (target, key, desc) {
    var reflectorSetMetadata = Reflect.defineMetadata;
    var holder = desc ? desc.value : key ? target[key] : target;
    reflectorSetMetadata(exports.OWNERSHIP_META_KEY, meta, holder);
}; };
exports.ownership = ownership;
var OwnershipGuard = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var OwnershipGuard = _classThis = /** @class */ (function () {
        function OwnershipGuard_1(reflector) {
            this.reflector = reflector;
        }
        OwnershipGuard_1.prototype.canActivate = function (context) {
            return __awaiter(this, void 0, void 0, function () {
                var meta, req, user, playerId, id, ownerPlayerId;
                var _a, _b;
                return __generator(this, function (_c) {
                    meta = this.reflector.get(exports.OWNERSHIP_META_KEY, context.getHandler());
                    req = context.switchToHttp().getRequest();
                    user = req.user;
                    if (!(user === null || user === void 0 ? void 0 : user.userId))
                        throw new domain_errors_1.ForbiddenAdminError({}, 'Authentication required for ownership check.');
                    if (user.role === 'ADMIN' || user.role === 'MODERATOR')
                        return [2 /*return*/, true]; // bypass tracé en audit par les contrôleurs admin
                    // Cas sans métadonnée : convention REST /players/:playerId — l'identité doit matcher.
                    if (!meta) {
                        playerId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.playerId;
                        if (playerId && user.playerId && playerId === user.playerId)
                            return [2 /*return*/, true];
                        throw new domain_errors_1.ForbiddenAdminError({}, 'You do not own this resource.');
                    }
                    id = (_b = req.params) === null || _b === void 0 ? void 0 : _b[meta.idParam];
                    if (!id)
                        throw new domain_errors_1.NotFoundError(meta.model, undefined);
                    ownerPlayerId = req.resourceOwnerPlayerId;
                    if (ownerPlayerId === undefined) {
                        // Le contrôleur/enrichisseur DOIT fournir resourceOwnerPlayerId ; son absence est un bug → refus.
                        throw new domain_errors_1.ForbiddenAdminError({}, 'Ownership enrichment missing for resource.');
                    }
                    if (ownerPlayerId !== user.playerId)
                        throw new domain_errors_1.ForbiddenAdminError({}, 'You do not own this resource.');
                    return [2 /*return*/, true];
                });
            });
        };
        return OwnershipGuard_1;
    }());
    __setFunctionName(_classThis, "OwnershipGuard");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OwnershipGuard = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OwnershipGuard = _classThis;
}();
exports.OwnershipGuard = OwnershipGuard;

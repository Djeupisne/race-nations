"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IS_PUBLIC_KEY = exports.Public = void 0;
/**
 * public.decorator.ts — ré-export canonique de @Public() (défini avec le JwtAuthGuard
 * pour garder la constante de métadonnée à un seul endroit).
 */
var jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
Object.defineProperty(exports, "Public", { enumerable: true, get: function () { return jwt_auth_guard_1.Public; } });
Object.defineProperty(exports, "IS_PUBLIC_KEY", { enumerable: true, get: function () { return jwt_auth_guard_1.IS_PUBLIC_KEY; } });

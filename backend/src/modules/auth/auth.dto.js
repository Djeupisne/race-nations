"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAgeDtoPipe = exports.LogoutDtoPipe = exports.RefreshDtoPipe = exports.LoginDtoPipe = exports.RegisterDtoPipe = void 0;
/**
 * auth.dto.ts — DTOs d'entrée Auth, validés Zod (INV-27) via ZodValidationPipe.
 * Les schémas canoniques vivent dans @race-nations/api-contracts (src/auth.ts) :
 * ce fichier les ré-expose sous forme de pipes prêts pour les contrôleurs Nest,
 * et ajoute les DTOs spécifiques backend non contractuels (réponse interne).
 */
var api_contracts_1 = require("@race-nations/api-contracts");
var zod_validation_pipe_1 = require("../../common/pipes/zod-validation.pipe");
exports.RegisterDtoPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.RegisterInputSchema);
exports.LoginDtoPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.LoginInputSchema);
exports.RefreshDtoPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.RefreshInputSchema);
exports.LogoutDtoPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.LogoutInputSchema);
exports.VerifyAgeDtoPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.VerifyAgeInputSchema);

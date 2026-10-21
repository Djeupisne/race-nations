"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAgeDtoPipe = exports.LogoutDtoPipe = exports.RefreshDtoPipe = exports.LoginDtoPipe = exports.RegisterDtoPipe = void 0;
const api_contracts_1 = require("@race-nations/api-contracts");
const zod_validation_pipe_1 = require("../../common/pipes/zod-validation.pipe");
exports.RegisterDtoPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.RegisterInputSchema);
exports.LoginDtoPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.LoginInputSchema);
exports.RefreshDtoPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.RefreshInputSchema);
exports.LogoutDtoPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.LogoutInputSchema);
exports.VerifyAgeDtoPipe = new zod_validation_pipe_1.ZodValidationPipe(api_contracts_1.VerifyAgeInputSchema);
//# sourceMappingURL=auth.dto.js.map
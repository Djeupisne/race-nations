"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameserversModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const gameservers_service_1 = require("./gameservers.service");
const fleet_health_service_1 = require("./fleet-health.service");
const result_validator_service_1 = require("./result-validator.service");
let GameserversModule = class GameserversModule {
};
exports.GameserversModule = GameserversModule;
exports.GameserversModule = GameserversModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [gameservers_service_1.GameserversService, fleet_health_service_1.FleetHealthService, result_validator_service_1.ResultValidatorService],
        exports: [gameservers_service_1.GameserversService, fleet_health_service_1.FleetHealthService, result_validator_service_1.ResultValidatorService],
    })
], GameserversModule);
//# sourceMappingURL=gameservers.module.js.map
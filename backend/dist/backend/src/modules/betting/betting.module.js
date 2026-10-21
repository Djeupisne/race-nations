"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BettingModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const wallet_module_1 = require("../wallet/wallet.module");
const matches_module_1 = require("../matches/matches.module");
const jurisdiction_service_1 = require("./jurisdiction.service");
const bet_limits_service_1 = require("./bet-limits.service");
const bet_validator_service_1 = require("./bet-validator.service");
const bet_odds_service_1 = require("./bet-odds.service");
const betting_service_1 = require("./betting.service");
const bet_settlement_service_1 = require("./bet-settlement.service");
const betting_controller_1 = require("./betting.controller");
let BettingModule = class BettingModule {
};
exports.BettingModule = BettingModule;
exports.BettingModule = BettingModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, wallet_module_1.WalletModule, (0, common_1.forwardRef)(() => matches_module_1.MatchesModule)],
        providers: [
            jurisdiction_service_1.JurisdictionService,
            bet_limits_service_1.BetLimitsService,
            bet_validator_service_1.BetValidatorService,
            bet_odds_service_1.BetOddsService,
            betting_service_1.BettingService,
            bet_settlement_service_1.BetSettlementService,
            { provide: 'BET_SETTLER', useExisting: bet_settlement_service_1.BetSettlementService },
        ],
        controllers: [betting_controller_1.BettingController],
        exports: [betting_service_1.BettingService, bet_settlement_service_1.BetSettlementService, jurisdiction_service_1.JurisdictionService],
    })
], BettingModule);
//# sourceMappingURL=betting.module.js.map
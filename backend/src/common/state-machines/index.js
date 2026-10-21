"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Barrel — machines à états (INV-22).
 * Source de vérité des transitions : ce dossier. Les enums Prisma et
 * shared/api-contracts/src/enums.ts ne définissent que l'alphabet des états.
 *
 * Usage typique :
 *   assertMatchTransition(match.status as MatchState, 'FINISHED_VALIDATED');
 *   assertBetTransition(bet.status as BetState, 'ESCROWED');
 */
__exportStar(require("./match.state-machine"), exports);
__exportStar(require("./ticket.state-machine"), exports);
__exportStar(require("./payment.state-machine"), exports);
__exportStar(require("./game-server.state-machine"), exports);
__exportStar(require("./sanction.state-machine"), exports);
__exportStar(require("./bet.state-machine"), exports);
__exportStar(require("./bet-market.state-machine"), exports);

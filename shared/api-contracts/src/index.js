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
exports.ResultValidationDtoSchema = exports.GameServerResultEnvelopeSchema = exports.RaceResultBodySchema = exports.ResultRowSchema = exports.ReconnectInputSchema = exports.JoinMatchInputSchema = exports.MatchSummaryDtoSchema = exports.MatchDtoSchema = exports.MatchPlayerDtoSchema = exports.TicketDtoSchema = exports.EnqueueInputSchema = void 0;
__exportStar(require("./version"), exports);
__exportStar(require("./enums"), exports);
__exportStar(require("./auth"), exports);
__exportStar(require("./player"), exports);
var match_1 = require("./match");
Object.defineProperty(exports, "EnqueueInputSchema", { enumerable: true, get: function () { return match_1.EnqueueInputSchema; } });
Object.defineProperty(exports, "TicketDtoSchema", { enumerable: true, get: function () { return match_1.TicketDtoSchema; } });
Object.defineProperty(exports, "MatchPlayerDtoSchema", { enumerable: true, get: function () { return match_1.MatchPlayerDtoSchema; } });
Object.defineProperty(exports, "MatchDtoSchema", { enumerable: true, get: function () { return match_1.MatchDtoSchema; } });
Object.defineProperty(exports, "MatchSummaryDtoSchema", { enumerable: true, get: function () { return match_1.MatchSummaryDtoSchema; } });
Object.defineProperty(exports, "JoinMatchInputSchema", { enumerable: true, get: function () { return match_1.JoinMatchInputSchema; } });
Object.defineProperty(exports, "ReconnectInputSchema", { enumerable: true, get: function () { return match_1.ReconnectInputSchema; } });
Object.defineProperty(exports, "ResultRowSchema", { enumerable: true, get: function () { return match_1.ResultRowSchema; } });
Object.defineProperty(exports, "RaceResultBodySchema", { enumerable: true, get: function () { return match_1.RaceResultBodySchema; } });
Object.defineProperty(exports, "GameServerResultEnvelopeSchema", { enumerable: true, get: function () { return match_1.GameServerResultEnvelopeSchema; } });
Object.defineProperty(exports, "ResultValidationDtoSchema", { enumerable: true, get: function () { return match_1.ResultValidationDtoSchema; } });
__exportStar(require("./betting"), exports);
//# sourceMappingURL=index.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeParimutuelSettlement = computeParimutuelSettlement;
exports.computeOneVersusOne = computeOneVersusOne;
exports.computePushRefund = computePushRefund;
exports.assertConservation = assertConservation;
const money_1 = require("./money");
function computeParimutuelSettlement(stakes, winningPlayerIds, houseEdgeBps) {
    const totalPool = stakes.reduce((acc, s) => acc + s.stake, 0);
    const houseCut = (0, money_1.applyBpsFloor)(totalPool, houseEdgeBps);
    const netPool = totalPool - houseCut;
    const winningStake = stakes.reduce((acc, s) => (winningPlayerIds.has(s.playerId) ? acc + s.stake : acc), 0);
    const payouts = [];
    let totalPaidOut = 0;
    for (const s of stakes) {
        if (winningPlayerIds.has(s.playerId) && winningStake > 0) {
            const p = (0, money_1.floorDiv)(s.stake * netPool, winningStake);
            payouts.push({ playerId: s.playerId, payout: p });
            totalPaidOut += p;
        }
        else {
            payouts.push({ playerId: s.playerId, payout: 0 });
        }
    }
    const residue = netPool - totalPaidOut;
    return { totalPool, houseCut, netPool, totalPaidOut, residue, payouts };
}
function computeOneVersusOne(stakeA, stakeB, winner, houseEdgeBps) {
    const stakes = [
        { playerId: 'A', stake: stakeA },
        { playerId: 'B', stake: stakeB },
    ];
    return computeParimutuelSettlement(stakes, new Set([winner]), houseEdgeBps);
}
function computePushRefund(stakes) {
    const totalPool = stakes.reduce((acc, s) => acc + s.stake, 0);
    return {
        totalPool,
        houseCut: 0,
        netPool: totalPool,
        totalPaidOut: totalPool,
        residue: 0,
        payouts: stakes.map((s) => ({ playerId: s.playerId, payout: s.stake })),
    };
}
function assertConservation(result, expectedDebits) {
    const credits = result.totalPaidOut + result.houseCut + result.residue;
    if (credits !== expectedDebits || result.totalPool !== expectedDebits) {
        throw new Error(`INV-05 conservation violated: pool=${result.totalPool}, debits=${expectedDebits}, credits=${credits}`);
    }
}
//# sourceMappingURL=parimutuel.js.map
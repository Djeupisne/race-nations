"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeParimutuelSettlement = computeParimutuelSettlement;
exports.computeOneVersusOne = computeOneVersusOne;
exports.computePushRefund = computePushRefund;
exports.assertConservation = assertConservation;
/**
 * parimutuel — calculs de settlement pari mutuel (docs/betting.md §4, INV-08..INV-16).
 * 100% entiers, 100% déterministe, zéro effet de bord : le settlement service applique
 * les mouvements via wallet.repository dans une transaction (INV-30).
 */
var money_1 = require("./money");
/**
 * Formule générale (INV-09) : payout_i = floor(stake_i × netPool / winningStake),
 * houseCut = floor(totalPool × bps / 10000) (INV-08), résidu → House.
 * Cas dégénérés : winningStake = 0 (aucun gagnant) → tout le pool est remboursable
 * (les services décident REFUNDED) ; ici payouts = 0 et residue = netPool non redistribué.
 */
function computeParimutuelSettlement(stakes, winningPlayerIds, houseEdgeBps) {
    var totalPool = stakes.reduce(function (acc, s) { return acc + s.stake; }, 0);
    var houseCut = (0, money_1.applyBpsFloor)(totalPool, houseEdgeBps);
    var netPool = totalPool - houseCut;
    var winningStake = stakes.reduce(function (acc, s) { return (winningPlayerIds.has(s.playerId) ? acc + s.stake : acc); }, 0);
    var payouts = [];
    var totalPaidOut = 0;
    for (var _i = 0, stakes_1 = stakes; _i < stakes_1.length; _i++) {
        var s = stakes_1[_i];
        if (winningPlayerIds.has(s.playerId) && winningStake > 0) {
            var p = (0, money_1.floorDiv)(s.stake * netPool, winningStake);
            payouts.push({ playerId: s.playerId, payout: p });
            totalPaidOut += p;
        }
        else {
            payouts.push({ playerId: s.playerId, payout: 0 });
        }
    }
    var residue = netPool - totalPaidOut; // >= 0 par construction du plancher (INV-09)
    return { totalPool: totalPool, houseCut: houseCut, netPool: netPool, totalPaidOut: totalPaidOut, residue: residue, payouts: payouts };
}
/**
 * Cas contractuel 1v1 (INV-08) : totalPool = stakeA + stakeB, houseCut = 5%,
 * le gagnant reçoit netPool, le perdant 0. Mises égales garanties par INV-10 en amont.
 */
function computeOneVersusOne(stakeA, stakeB, winner, houseEdgeBps) {
    var stakes = [
        { playerId: 'A', stake: stakeA },
        { playerId: 'B', stake: stakeB },
    ];
    return computeParimutuelSettlement(stakes, new Set([winner]), houseEdgeBps);
}
/**
 * Égalité / push (INV-16) : chaque joueur récupère sa mise, houseCut = 0.
 * totalPaidOut = totalPool, residue = 0.
 */
function computePushRefund(stakes) {
    var totalPool = stakes.reduce(function (acc, s) { return acc + s.stake; }, 0);
    return {
        totalPool: totalPool,
        houseCut: 0,
        netPool: totalPool,
        totalPaidOut: totalPool,
        residue: 0,
        payouts: stakes.map(function (s) { return ({ playerId: s.playerId, payout: s.stake }); }),
    };
}
/** Invariant de conservation vérifiable en test (INV-05) : débits == crédits + houseCut+residue. */
function assertConservation(result, expectedDebits) {
    var credits = result.totalPaidOut + result.houseCut + result.residue;
    if (credits !== expectedDebits || result.totalPool !== expectedDebits) {
        throw new Error("INV-05 conservation violated: pool=".concat(result.totalPool, ", debits=").concat(expectedDebits, ", credits=").concat(credits));
    }
}

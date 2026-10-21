"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Tests unitaires du settlement parimutuel — INV-05, INV-08..INV-09, INV-16.
 * (Matrice testabilité docs/invariants.md : ligne 08..19 niveau unit.)
 */
var parimutuel_1 = require("./parimutuel");
var HOUSE_EDGE_BPS = 500; // contrat betting.config.ts — 5%
describe('computeOneVersusOne (INV-08)', function () {
    it('pool 2000 cr → houseCut 100, netPool 1900 intégralement au gagnant', function () {
        var _a, _b;
        var r = (0, parimutuel_1.computeOneVersusOne)(1000, 1000, 'A', HOUSE_EDGE_BPS);
        expect(r.totalPool).toBe(2000);
        expect(r.houseCut).toBe(100);
        expect(r.netPool).toBe(1900);
        expect((_a = r.payouts.find(function (p) { return p.playerId === 'A'; })) === null || _a === void 0 ? void 0 : _a.payout).toBe(1900);
        expect((_b = r.payouts.find(function (p) { return p.playerId === 'B'; })) === null || _b === void 0 ? void 0 : _b.payout).toBe(0);
        expect(r.residue).toBe(0);
    });
    it('mises impaires acceptées au calcul : payout proportionnel (INV-09)', function () {
        var _a;
        // stakeA=3000 stakeB=1000, A gagne : netPool = 4000 - floor(4000*5%) = 3800 ; A reçoit tout (winningStake=3000)
        var r = (0, parimutuel_1.computeOneVersusOne)(3000, 1000, 'A', HOUSE_EDGE_BPS);
        expect(r.houseCut).toBe(200);
        expect((_a = r.payouts.find(function (p) { return p.playerId === 'A'; })) === null || _a === void 0 ? void 0 : _a.payout).toBe(3800);
    });
    it('conservation exacte à l\'unité près (INV-05)', function () {
        var r = (0, parimutuel_1.computeOneVersusOne)(1000, 1000, 'B', HOUSE_EDGE_BPS);
        expect(function () { return (0, parimutuel_1.assertConservation)(r, 2000); }).not.toThrow();
    });
    it('houseCut plancher : pool 199 → cut 9 (floor(199*500/10000)=9), jamais d\'arrondi supérieur', function () {
        var r = (0, parimutuel_1.computeOneVersusOne)(100, 99, 'A', HOUSE_EDGE_BPS);
        expect(r.houseCut).toBe(9);
        expect(r.netPool).toBe(190);
    });
});
describe('computeParimutuelSettlement — N outcomes (INV-09)', function () {
    var stakes = [
        { playerId: 'p1', stake: 700 },
        { playerId: 'p2', stake: 200 },
        { playerId: 'p3', stake: 100 },
    ];
    it('payout_i = floor(stake_i × netPool / winningStake) pour les gagnants, 0 sinon', function () {
        var r = (0, parimutuel_1.computeParimutuelSettlement)(stakes, new Set(['p1', 'p2']), HOUSE_EDGE_BPS);
        // totalPool=1000, houseCut=50, netPool=950, winningStake=900
        expect(r.totalPool).toBe(1000);
        expect(r.houseCut).toBe(50);
        expect(r.netPool).toBe(950);
        expect(r.payouts).toEqual([
            { playerId: 'p1', payout: Math.floor((700 * 950) / 900) }, // 738
            { playerId: 'p2', payout: Math.floor((200 * 950) / 900) }, // 211
            { playerId: 'p3', payout: 0 },
        ]);
        expect(r.totalPaidOut).toBe(738 + 211);
        expect(r.residue).toBe(950 - 949); // 1 crédit → House (INV-09 résidu jamais perdu)
        expect(function () { return (0, parimutuel_1.assertConservation)(r, 1000); }).not.toThrow();
    });
    it('somme des payouts <= netPool et résidu >= 0 (INV-09)', function () {
        var _a;
        var r = (0, parimutuel_1.computeParimutuelSettlement)(stakes, new Set(['p3']), HOUSE_EDGE_BPS);
        expect(r.totalPaidOut).toBeLessThanOrEqual(r.netPool);
        expect(r.residue).toBeGreaterThanOrEqual(0);
        expect((_a = r.payouts.find(function (p) { return p.playerId === 'p3'; })) === null || _a === void 0 ? void 0 : _a.payout).toBe(950);
    });
    it('aucun gagnant (winningStake=0) → payouts nuls, residue=netPool (remboursement géré par le service)', function () {
        var r = (0, parimutuel_1.computeParimutuelSettlement)(stakes, new Set(), HOUSE_EDGE_BPS);
        expect(r.totalPaidOut).toBe(0);
        expect(r.residue).toBe(r.netPool);
    });
});
describe('computePushRefund (INV-16)', function () {
    it('égalité : remboursement intégral des mises, houseCut = 0', function () {
        var stakes = [
            { playerId: 'a', stake: 1000 },
            { playerId: 'b', stake: 1000 },
        ];
        var r = (0, parimutuel_1.computePushRefund)(stakes);
        expect(r.houseCut).toBe(0);
        expect(r.payouts).toEqual([
            { playerId: 'a', payout: 1000 },
            { playerId: 'b', payout: 1000 },
        ]);
        expect(r.residue).toBe(0);
        expect(function () { return (0, parimutuel_1.assertConservation)(r, 2000); }).not.toThrow();
    });
});
describe('INV-01 — entiers uniquement', function () {
    it('tous les montants produits sont des entiers sûrs', function () {
        var r = (0, parimutuel_1.computeParimutuelSettlement)([
            { playerId: 'x', stake: 333 },
            { playerId: 'y', stake: 777 },
        ], new Set(['x', 'y']), HOUSE_EDGE_BPS);
        for (var _i = 0, _a = __spreadArray([r.totalPool, r.houseCut, r.netPool, r.totalPaidOut, r.residue], r.payouts.map(function (p) { return p.payout; }), true); _i < _a.length; _i++) {
            var v = _a[_i];
            expect(Number.isSafeInteger(v)).toBe(true);
        }
    });
});

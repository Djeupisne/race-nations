"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLOCK = exports.FixedClock = exports.SystemClock = void 0;
exports.ageMs = ageMs;
/** Horloge système (défaut DI en production). */
var SystemClock = /** @class */ (function () {
    function SystemClock() {
    }
    SystemClock.prototype.now = function () {
        return Date.now();
    };
    SystemClock.prototype.date = function () {
        return new Date(this.now());
    };
    return SystemClock;
}());
exports.SystemClock = SystemClock;
/** Horloge figée pour les tests déterministes. */
var FixedClock = /** @class */ (function () {
    function FixedClock(startMs) {
        if (startMs === void 0) { startMs = Date.now(); }
        this.current = typeof startMs === 'string' ? Date.parse(startMs) : startMs;
    }
    FixedClock.prototype.now = function () {
        return this.current;
    };
    FixedClock.prototype.date = function () {
        return new Date(this.current);
    };
    FixedClock.prototype.set = function (ms) {
        this.current = typeof ms === 'string' ? Date.parse(ms) : ms;
    };
    FixedClock.prototype.advance = function (ms) {
        this.current += ms;
    };
    return FixedClock;
}());
exports.FixedClock = FixedClock;
/** Jeton DI — fournir SystemClock dans AppModule, remplacer dans les tests e2e. */
exports.CLOCK = Symbol('CLOCK');
/** Helper : âge en ms d'un timestamp par rapport à l'horloge fournie. */
function ageMs(sinceEpochMs, clock) {
    return Math.max(0, clock.now() - sinceEpochMs);
}

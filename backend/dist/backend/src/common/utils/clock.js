"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clock = exports.CLOCK = exports.FixedClock = exports.SystemClock = void 0;
exports.ageMs = ageMs;
class SystemClock {
    now() {
        return new Date();
    }
    nowMs() {
        return Date.now();
    }
}
exports.SystemClock = SystemClock;
class FixedClock {
    current;
    constructor(startMs = Date.now()) {
        this.current = typeof startMs === 'string' ? Date.parse(startMs) : startMs;
    }
    now() {
        return new Date(this.current);
    }
    nowMs() {
        return this.current;
    }
    set(ms) {
        this.current = typeof ms === 'string' ? Date.parse(ms) : ms;
    }
    advance(ms) {
        this.current += ms;
    }
}
exports.FixedClock = FixedClock;
exports.CLOCK = Symbol('CLOCK');
exports.clock = new SystemClock();
function ageMs(sinceEpochMs, clock) {
    return Math.max(0, clock.nowMs() - sinceEpochMs);
}
//# sourceMappingURL=clock.js.map
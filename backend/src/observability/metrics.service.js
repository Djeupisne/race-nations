"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
/**
 * MetricsService — compteurs/histogrammes Prometheus maison (pas d'SDK lourd).
 * Exposition via /metrics (text format) par MetricsController. Noms stables
 * documentés dans docs/observability.md §4 ; les dashboards/alertes y réfèrent.
 */
var common_1 = require("@nestjs/common");
var labelKey = function (labels) {
    return Object.keys(labels)
        .sort()
        .map(function (k) { return "".concat(k, "=\"").concat(String(labels[k]).replace(/"/g, '\\"'), "\""); })
        .join(',');
};
var MetricsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var MetricsService = _classThis = /** @class */ (function () {
        function MetricsService_1() {
            this.counters = new Map();
            this.gauges = new Map();
            this.histograms = new Map();
            this.bucketDefs = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
        }
        MetricsService_1.prototype.inc = function (name, labels, value) {
            var _a;
            if (labels === void 0) { labels = {}; }
            if (value === void 0) { value = 1; }
            var m = this.counters.get(name);
            if (!m)
                this.counters.set(name, (m = new Map()));
            var key = labelKey(labels);
            m.set(key, ((_a = m.get(key)) !== null && _a !== void 0 ? _a : 0) + value);
        };
        MetricsService_1.prototype.setGauge = function (name, labels, value) {
            var m = this.gauges.get(name);
            if (!m)
                this.gauges.set(name, (m = new Map()));
            m.set(labelKey(labels), value);
        };
        MetricsService_1.prototype.observe = function (name, labels, valueMs) {
            var h = this.histograms.get(name);
            if (!h)
                this.histograms.set(name, (h = { buckets: this.bucketDefs, counts: new Array(this.bucketDefs.length).fill(0), sum: 0, labels: new Map() }));
            var key = labelKey(labels);
            var entry = h.labels.get(key);
            if (!entry)
                h.labels.set(key, (entry = { counts: new Array(h.buckets.length).fill(0), sum: 0 }));
            entry.sum += valueMs;
            for (var i = 0; i < h.buckets.length; i++) {
                if (valueMs <= h.buckets[i])
                    entry.counts[i]++;
            }
        };
        /** Rendu text/format Prometheus. */
        MetricsService_1.prototype.render = function () {
            var lines = [];
            for (var _i = 0, _a = this.counters; _i < _a.length; _i++) {
                var _b = _a[_i], name_1 = _b[0], series = _b[1];
                lines.push("# TYPE ".concat(name_1, " counter"));
                for (var _c = 0, series_1 = series; _c < series_1.length; _c++) {
                    var _d = series_1[_c], labels = _d[0], value = _d[1];
                    lines.push("".concat(name_1, "{").concat(labels, "} ").concat(value));
                }
            }
            for (var _e = 0, _f = this.gauges; _e < _f.length; _e++) {
                var _g = _f[_e], name_2 = _g[0], series = _g[1];
                lines.push("# TYPE ".concat(name_2, " gauge"));
                for (var _h = 0, series_2 = series; _h < series_2.length; _h++) {
                    var _j = series_2[_h], labels = _j[0], value = _j[1];
                    lines.push("".concat(name_2, "{").concat(labels, "} ").concat(value));
                }
            }
            for (var _k = 0, _l = this.histograms; _k < _l.length; _k++) {
                var _m = _l[_k], name_3 = _m[0], h = _m[1];
                lines.push("# TYPE ".concat(name_3, " histogram"));
                for (var _o = 0, _p = h.labels; _o < _p.length; _o++) {
                    var _q = _p[_o], labels = _q[0], entry = _q[1];
                    var prefix = labels ? "".concat(labels, ",") : '';
                    for (var i = 0; i < h.buckets.length; i++) {
                        lines.push("".concat(name_3, "_bucket{").concat(prefix, "le=\"").concat(h.buckets[i], "\"} ").concat(entry.counts[i]));
                    }
                    lines.push("".concat(name_3, "_bucket{").concat(prefix, "le=\"+Inf\"} ").concat(entry.counts[entry.counts.length - 1]));
                    lines.push("".concat(name_3, "_sum{").concat(labels, "} ").concat(entry.sum));
                    lines.push("".concat(name_3, "_count{").concat(labels, "} ").concat(entry.counts[h.buckets.length - 1]));
                }
            }
            return lines.join('\n') + '\n';
        };
        return MetricsService_1;
    }());
    __setFunctionName(_classThis, "MetricsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MetricsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MetricsService = _classThis;
}();
exports.MetricsService = MetricsService;

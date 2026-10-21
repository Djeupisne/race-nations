"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const labelKey = (labels) => Object.keys(labels)
    .sort()
    .map((k) => `${k}="${String(labels[k]).replace(/"/g, '\\"')}"`)
    .join(',');
let MetricsService = class MetricsService {
    counters = new Map();
    gauges = new Map();
    histograms = new Map();
    bucketDefs = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    inc(name, labels = {}, value = 1) {
        let m = this.counters.get(name);
        if (!m)
            this.counters.set(name, (m = new Map()));
        const key = labelKey(labels);
        m.set(key, (m.get(key) ?? 0) + value);
    }
    setGauge(name, labels, value) {
        let m = this.gauges.get(name);
        if (!m)
            this.gauges.set(name, (m = new Map()));
        m.set(labelKey(labels), value);
    }
    observe(name, labels, valueMs) {
        let h = this.histograms.get(name);
        if (!h)
            this.histograms.set(name, (h = { buckets: this.bucketDefs, counts: new Array(this.bucketDefs.length).fill(0), sum: 0, labels: new Map() }));
        const key = labelKey(labels);
        let entry = h.labels.get(key);
        if (!entry)
            h.labels.set(key, (entry = { counts: new Array(h.buckets.length).fill(0), sum: 0 }));
        entry.sum += valueMs;
        for (let i = 0; i < h.buckets.length; i++) {
            if (valueMs <= h.buckets[i])
                entry.counts[i]++;
        }
    }
    render() {
        const lines = [];
        for (const [name, series] of this.counters) {
            lines.push(`# TYPE ${name} counter`);
            for (const [labels, value] of series) {
                lines.push(`${name}{${labels}} ${value}`);
            }
        }
        for (const [name, series] of this.gauges) {
            lines.push(`# TYPE ${name} gauge`);
            for (const [labels, value] of series) {
                lines.push(`${name}{${labels}} ${value}`);
            }
        }
        for (const [name, h] of this.histograms) {
            lines.push(`# TYPE ${name} histogram`);
            for (const [labels, entry] of h.labels) {
                const prefix = labels ? `${labels},` : '';
                for (let i = 0; i < h.buckets.length; i++) {
                    lines.push(`${name}_bucket{${prefix}le="${h.buckets[i]}"} ${entry.counts[i]}`);
                }
                lines.push(`${name}_bucket{${prefix}le="+Inf"} ${entry.counts[entry.counts.length - 1]}`);
                lines.push(`${name}_sum{${labels}} ${entry.sum}`);
                lines.push(`${name}_count{${labels}} ${entry.counts[h.buckets.length - 1]}`);
            }
        }
        return lines.join('\n') + '\n';
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)()
], MetricsService);
//# sourceMappingURL=metrics.service.js.map
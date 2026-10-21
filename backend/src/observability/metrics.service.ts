/**
 * MetricsService — compteurs/histogrammes Prometheus maison (pas d'SDK lourd).
 * Exposition via /metrics (text format) par MetricsController. Noms stables
 * documentés dans docs/observability.md §4 ; les dashboards/alertes y réfèrent.
 */
import { Injectable } from '@nestjs/common';

type LabelValue = string | number;
type Labels = Record<string, LabelValue>;

const labelKey = (labels: Labels): string =>
  Object.keys(labels)
    .sort()
    .map((k) => `${k}="${String(labels[k]).replace(/"/g, '\\"')}"`)
    .join(',');

@Injectable()
export class MetricsService {
  private counters = new Map<string, Map<string, number>>();
  private gauges = new Map<string, Map<string, number>>();
  private histograms = new Map<string, { buckets: number[]; counts: number[]; sum: number; labels: Map<string, { counts: number[]; sum: number }> }>();

  private readonly bucketDefs = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

  inc(name: string, labels: Labels = {}, value = 1): void {
    let m = this.counters.get(name);
    if (!m) this.counters.set(name, (m = new Map()));
    const key = labelKey(labels);
    m.set(key, (m.get(key) ?? 0) + value);
  }

  setGauge(name: string, labels: Labels, value: number): void {
    let m = this.gauges.get(name);
    if (!m) this.gauges.set(name, (m = new Map()));
    m.set(labelKey(labels), value);
  }

  observe(name: string, labels: Labels, valueMs: number): void {
    let h = this.histograms.get(name);
    if (!h) this.histograms.set(name, (h = { buckets: this.bucketDefs, counts: new Array(this.bucketDefs.length).fill(0), sum: 0, labels: new Map() }));
    const key = labelKey(labels);
    let entry = h.labels.get(key);
    if (!entry) h.labels.set(key, (entry = { counts: new Array(h.buckets.length).fill(0), sum: 0 }));
    entry.sum += valueMs;
    for (let i = 0; i < h.buckets.length; i++) {
      if (valueMs <= h.buckets[i]) entry.counts[i]++;
    }
  }

  /** Rendu text/format Prometheus. */
  render(): string {
    const lines: string[] = [];
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
}

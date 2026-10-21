type LabelValue = string | number;
type Labels = Record<string, LabelValue>;
export declare class MetricsService {
    private counters;
    private gauges;
    private histograms;
    private readonly bucketDefs;
    inc(name: string, labels?: Labels, value?: number): void;
    setGauge(name: string, labels: Labels, value: number): void;
    observe(name: string, labels: Labels, valueMs: number): void;
    render(): string;
}
export {};

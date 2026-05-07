export type MetricValue<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "unmeasured" | "unavailable" | "out-of-phase" };

export function metricOk<T>(value: T): MetricValue<T> {
  return { ok: true, value };
}

export function metricUnavailable(): MetricValue<never> {
  return { ok: false, reason: "unavailable" };
}

export function fmtMetric<T>(m: MetricValue<T>, fmt: (v: T) => string): string {
  return m.ok ? fmt(m.value) : "—";
}

export function fmtMetricString(m: MetricValue<string>): string {
  return m.ok ? m.value : "—";
}

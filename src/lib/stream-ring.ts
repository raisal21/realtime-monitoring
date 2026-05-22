// Fixed-capacity ring buffer for one telemetry stream, stored columnar —
// one typed array per field. push() overwrites the oldest slot in place, so
// the 10 Hz ingest path allocates nothing (the previous object-array buffer
// rebuilt the whole array on every insert). See NAPKIN 2026-05-22.

// 60 min of 10 Hz samples — deep enough to back the 1h preset, the smallest
// in RANGE_PRESETS_QUICK. Wider presets are served by Layer 3 server tiles.
const HOT_RING_MINUTES = 60;
const HOT_RING_HZ = 10;
export const HOT_RING_CAPACITY = HOT_RING_MINUTES * 60 * HOT_RING_HZ;

export class StreamRing<T extends Record<string, number>> {
  readonly capacity: number;
  private readonly fields: readonly string[];
  private readonly cols: Record<string, Float32Array | Float64Array>;
  private writeIdx = 0;
  private len = 0;

  // f64Fields names the columns that need Float64 — `timestamp`, whose
  // epoch-ms magnitude (~1.7e12) overflows Float32's 24-bit integer range
  // and would otherwise quantize to ~2-minute steps.
  constructor(
    capacity: number,
    fields: readonly (keyof T & string)[],
    f64Fields: readonly string[] = ["timestamp"],
  ) {
    this.capacity = capacity;
    this.fields = fields;
    this.cols = {};
    const wide = new Set(f64Fields);
    for (const f of fields) {
      this.cols[f] = wide.has(f)
        ? new Float64Array(capacity)
        : new Float32Array(capacity);
    }
  }

  get size(): number {
    return this.len;
  }

  // Writes one sample into the oldest slot. No allocation.
  push(sample: T): void {
    for (const f of this.fields) {
      this.cols[f][this.writeIdx] = sample[f];
    }
    this.writeIdx = (this.writeIdx + 1) % this.capacity;
    if (this.len < this.capacity) this.len += 1;
  }

  // Logical index 0 = oldest, size-1 = newest → physical slot.
  private slot(i: number): number {
    const start = this.len < this.capacity ? 0 : this.writeIdx;
    return (start + i) % this.capacity;
  }

  // Single field read at a logical index — no allocation. Hot path for the
  // downsampler and FlowRuler.
  field(name: string, i: number): number {
    return this.cols[name][this.slot(i)];
  }

  // Reconstructs the sample object — allocates, so off-hot-path only
  // (scalar readouts via latest()/first()).
  at(i: number): T {
    const p = this.slot(i);
    const out: Record<string, number> = {};
    for (const f of this.fields) out[f] = this.cols[f][p];
    return out as T;
  }

  latest(): T | undefined {
    return this.len === 0 ? undefined : this.at(this.len - 1);
  }

  first(): T | undefined {
    return this.len === 0 ? undefined : this.at(0);
  }
}

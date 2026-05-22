// A decimated point: the trace value paired with the y-axis coordinate
// (depth or timestamp) of the exact sample it came from — an outlier keeps
// its true position rather than snapping to a bin centre.
export type EnvelopePoint = [value: number, y: number];

export interface Envelope {
  min: EnvelopePoint[];
  max: EnvelopePoint[];
}

// Minimal ring surface the downsampler needs — lets it accept any
// StreamRing<T> regardless of T (StreamRing is invariant in T).
interface ReadableRing {
  readonly size: number;
  field(name: string, i: number): number;
}

// BIN-MM: split the ring into `binCount` equal index ranges, emit the min
// and max of `trace` in each. Two points per bin keep safety-critical
// spikes that an averaging downsampler would erase (NAPKIN 2026-05-15 —
// Decimation: BIN-MM). `yKey` is the field placing each point on the chart
// value axis ("depth" or "timestamp").
export function binMinMax(
  ring: ReadableRing,
  trace: string,
  yKey: string,
  binCount: number,
): Envelope {
  const n = ring.size;
  const min: EnvelopePoint[] = [];
  const max: EnvelopePoint[] = [];
  if (n === 0 || binCount <= 0) return { min, max };

  const per = n / binCount;
  for (let b = 0; b < binCount; b++) {
    const lo = Math.floor(b * per);
    const hi = b === binCount - 1 ? n : Math.floor((b + 1) * per);
    if (hi <= lo) continue; // fewer samples than bins — skip empty bin

    let loV = ring.field(trace, lo);
    let hiV = loV;
    let loI = lo;
    let hiI = lo;
    for (let i = lo + 1; i < hi; i++) {
      const v = ring.field(trace, i);
      if (v < loV) {
        loV = v;
        loI = i;
      }
      if (v > hiV) {
        hiV = v;
        hiI = i;
      }
    }
    min.push([loV, ring.field(yKey, loI)]);
    max.push([hiV, ring.field(yKey, hiI)]);
  }
  return { min, max };
}

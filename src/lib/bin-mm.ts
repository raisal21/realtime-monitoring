// A decimated point: the trace value paired with the y-axis coordinate
// (depth or timestamp) of the exact sample it came from. An outlier keeps
// its true position rather than snapping to a bin centre.
export type EnvelopePoint = [value: number, y: number];

export interface Envelope {
  min: EnvelopePoint[];
  max: EnvelopePoint[];
}

// Minimal ring surface the downsampler needs. This lets it accept any
// StreamRing<T> regardless of T (StreamRing is invariant in T).
interface ReadableRing {
  readonly size: number;
  field(name: string, i: number): number;
}

export interface BinMinMaxOptions {
  binCount: number;
  yMin?: number;
  yMax?: number;
  anchorEdges?: boolean;
}

// BIN-MM: split the visible ring samples into equal index ranges, emit the min
// and max of `trace` in each. Two points per bin keep safety-critical spikes
// that an averaging downsampler would erase (NAPKIN 2026-05-15).
export function binMinMax(
  ring: ReadableRing,
  trace: string,
  yKey: string,
  options: number | BinMinMaxOptions,
): Envelope {
  const n = ring.size;
  const min: EnvelopePoint[] = [];
  const max: EnvelopePoint[] = [];
  const cfg = typeof options === "number" ? { binCount: options } : options;
  const binCount = Math.floor(cfg.binCount);
  if (n === 0 || binCount <= 0) return { min, max };

  const yMin = cfg.yMin ?? -Infinity;
  const yMax = cfg.yMax ?? Infinity;
  const inViewport = (y: number): boolean =>
    Number.isFinite(y) && y >= yMin && y <= yMax;

  let visibleCount = 0;
  let first: EnvelopePoint | null = null;
  let last: EnvelopePoint | null = null;
  for (let i = 0; i < n; i++) {
    const y = ring.field(yKey, i);
    if (!inViewport(y)) continue;
    const point: EnvelopePoint = [ring.field(trace, i), y];
    first ??= point;
    last = point;
    visibleCount++;
  }
  if (visibleCount === 0) return { min, max };

  type BinState = {
    loV: number;
    hiV: number;
    loY: number;
    hiY: number;
  };

  const bins: Array<BinState | undefined> = [];
  const per = visibleCount / binCount;
  let currentBin = 0;
  let nextHi = Math.floor(per);
  let visibleOrdinal = 0;

  for (let i = 0; i < n; i++) {
    const y = ring.field(yKey, i);
    if (!inViewport(y)) continue;

    while (visibleOrdinal >= nextHi && currentBin < binCount - 1) {
      currentBin++;
      nextHi =
        currentBin === binCount - 1
          ? visibleCount
          : Math.floor((currentBin + 1) * per);
    }

    const v = ring.field(trace, i);
    const bin = bins[currentBin];
    if (!bin) {
      bins[currentBin] = { loV: v, hiV: v, loY: y, hiY: y };
    } else {
      if (v < bin.loV) {
        bin.loV = v;
        bin.loY = y;
      }
      if (v > bin.hiV) {
        bin.hiV = v;
        bin.hiY = y;
      }
    }
    visibleOrdinal++;
  }

  for (const bin of bins) {
    if (!bin) continue;
    min.push([bin.loV, bin.loY]);
    max.push([bin.hiV, bin.hiY]);
  }

  if (cfg.anchorEdges && first && last) {
    anchorEdge(min, first, last);
    anchorEdge(max, first, last);
  }
  return { min, max };
}

function anchorEdge(
  points: EnvelopePoint[],
  first: EnvelopePoint,
  last: EnvelopePoint,
): void {
  if (points[0]?.[1] !== first[1]) {
    points.unshift(first);
  }
  if (points.at(-1)?.[1] !== last[1]) {
    points.push(last);
  }
}

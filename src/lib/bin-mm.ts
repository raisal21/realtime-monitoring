// A decimated point: the trace value paired with the y-axis coordinate
// (depth or timestamp) of the exact sample it came from. An outlier keeps
// its true position rather than snapping to a bin centre.
export type EnvelopePoint = [value: number, y: number];

export interface Envelope {
  min: EnvelopePoint[];
  max: EnvelopePoint[];
  line: EnvelopePoint[];
}

// Minimal ring surface the downsampler needs. This lets it accept any
// StreamRing<T> regardless of T (StreamRing is invariant in T).
interface ReadableRing {
  readonly size: number;
  field(name: string, i: number): number;
}

type SamplePoint = {
  value: number;
  y: number;
  ordinal: number;
};

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
  const line: EnvelopePoint[] = [];
  const cfg = typeof options === "number" ? { binCount: options } : options;
  const binCount = Math.floor(cfg.binCount);
  if (n === 0 || binCount <= 0) return { min, max, line };

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
  if (visibleCount === 0) return { min, max, line };

  type BinState = {
    first: SamplePoint;
    last: SamplePoint;
    lo: SamplePoint;
    hi: SamplePoint;
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
    const point: SamplePoint = { value: v, y, ordinal: visibleOrdinal };
    const bin = bins[currentBin];
    if (!bin) {
      bins[currentBin] = {
        first: point,
        last: point,
        lo: point,
        hi: point,
      };
    } else {
      bin.last = point;
      if (v < bin.lo.value) {
        bin.lo = point;
      }
      if (v > bin.hi.value) {
        bin.hi = point;
      }
    }
    visibleOrdinal++;
  }

  for (const bin of bins) {
    if (!bin) continue;
    min.push(toEnvelopePoint(bin.lo));
    max.push(toEnvelopePoint(bin.hi));
    appendLinePoints(line, [bin.first, bin.last, bin.lo, bin.hi]);
  }

  if (cfg.anchorEdges && first && last) {
    anchorEdge(min, first, last);
    anchorEdge(max, first, last);
  }
  return { min, max, line };
}

function toEnvelopePoint(point: SamplePoint): EnvelopePoint {
  return [point.value, point.y];
}

function appendLinePoints(
  target: EnvelopePoint[],
  points: SamplePoint[],
): void {
  const seen = new Set<number>();
  for (const point of points
    .filter((p) => {
      if (seen.has(p.ordinal)) return false;
      seen.add(p.ordinal);
      return true;
    })
    .sort((a, b) => a.ordinal - b.ordinal)) {
    const next = toEnvelopePoint(point);
    const previous = target.at(-1);
    if (previous?.[0] === next[0] && previous[1] === next[1]) continue;
    target.push(next);
  }
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

"use client";

import * as React from "react";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";

export type TerrainPreset = "gruvbox" | "tomorrow" | "solarized";

interface TerrainTweaks {
  detail: number;
  scale: number;
  speed: number;
  octaves: number;
  levels: number;
  lineColor: string;
  lineAlpha: number;
  lineWidth: number;
  background: string;
  vignette: boolean;
  sweep: boolean;
  sweepColor: string;
}

interface TerrainProps {
  preset?: TerrainPreset;
  className?: string;
}

const PRESETS: Record<TerrainPreset, TerrainTweaks> = {
  gruvbox: {
    detail: 12,
    scale: 300,
    speed: 0.04,
    octaves: 5,
    levels: 18,
    lineColor: "#a89984",
    lineAlpha: 0.7,
    lineWidth: 0.8,
    background: "#1d2021",
    vignette: true,
    sweep: true,
    sweepColor: "rgba(131,165,152,0.12)",
  },
  tomorrow: {
    detail: 12,
    scale: 300,
    speed: 0.04,
    octaves: 5,
    levels: 18,
    lineColor: "#999999",
    lineAlpha: 0.65,
    lineWidth: 0.8,
    background: "#2d2d2d",
    vignette: true,
    sweep: true,
    sweepColor: "rgba(102,204,204,0.12)",
  },
  solarized: {
    detail: 12,
    scale: 300,
    speed: 0.04,
    octaves: 5,
    levels: 18,
    lineColor: "#708c94",
    lineAlpha: 0.65,
    lineWidth: 0.8,
    background: "#002b36",
    vignette: true,
    sweep: true,
    sweepColor: "rgba(42,161,152,0.12)",
  },
};

// ============================================================
// PERLIN-LIKE NOISE (Improved Perlin, 2D + time)
// ============================================================
const Noise = (() => {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  for (let i = 255; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  const grad = (hash: number, x: number, y: number, z: number) => {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };

  function noise3(x: number, y: number, z: number) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = fade(x),
      v = fade(y),
      w = fade(z);
    const A = perm[X] + Y,
      AA = perm[A] + Z,
      AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y,
      BA = perm[B] + Z,
      BB = perm[B + 1] + Z;
    return lerp(
      lerp(
        lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u),
        lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u),
        v,
      ),
      lerp(
        lerp(
          grad(perm[AA + 1], x, y, z - 1),
          grad(perm[BA + 1], x - 1, y, z - 1),
          u,
        ),
        lerp(
          grad(perm[AB + 1], x, y - 1, z - 1),
          grad(perm[BB + 1], x - 1, y - 1, z - 1),
          u,
        ),
        v,
      ),
      w,
    );
  }

  function fbm(x: number, y: number, z: number, octaves: number) {
    let v = 0,
      amp = 1,
      freq = 1,
      norm = 0;
    for (let i = 0; i < octaves; i++) {
      v += amp * noise3(x * freq, y * freq, z * freq);
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return v / norm;
  }
  return { noise3, fbm };
})();

// ============================================================
// MARCHING SQUARES
// ============================================================
function marchSegments(
  field: Float32Array,
  cols: number,
  rows: number,
  cellW: number,
  cellH: number,
  threshold: number,
  out: number[],
) {
  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      const i = y * cols + x;
      const tl = field[i];
      const tr = field[i + 1];
      const br = field[i + cols + 1];
      const bl = field[i + cols];

      let c = 0;
      if (tl > threshold) c |= 8;
      if (tr > threshold) c |= 4;
      if (br > threshold) c |= 2;
      if (bl > threshold) c |= 1;
      if (c === 0 || c === 15) continue;

      const px = x * cellW;
      const py = y * cellH;

      const lerpEdge = (a: number, b: number) => (threshold - a) / (b - a);
      const top = () => [px + cellW * lerpEdge(tl, tr), py] as [number, number];
      const right = () =>
        [px + cellW, py + cellH * lerpEdge(tr, br)] as [number, number];
      const bottom = () =>
        [px + cellW * lerpEdge(bl, br), py + cellH] as [number, number];
      const left = () =>
        [px, py + cellH * lerpEdge(tl, bl)] as [number, number];

      let a: [number, number],
        b: [number, number],
        c2: [number, number],
        d: [number, number];
      switch (c) {
        case 1:
          a = left();
          b = bottom();
          out.push(a[0], a[1], b[0], b[1]);
          break;
        case 2:
          a = bottom();
          b = right();
          out.push(a[0], a[1], b[0], b[1]);
          break;
        case 3:
          a = left();
          b = right();
          out.push(a[0], a[1], b[0], b[1]);
          break;
        case 4:
          a = top();
          b = right();
          out.push(a[0], a[1], b[0], b[1]);
          break;
        case 5:
          a = top();
          b = left();
          c2 = bottom();
          d = right();
          out.push(a[0], a[1], b[0], b[1], c2[0], c2[1], d[0], d[1]);
          break;
        case 6:
          a = top();
          b = bottom();
          out.push(a[0], a[1], b[0], b[1]);
          break;
        case 7:
          a = top();
          b = left();
          out.push(a[0], a[1], b[0], b[1]);
          break;
        case 8:
          a = top();
          b = left();
          out.push(a[0], a[1], b[0], b[1]);
          break;
        case 9:
          a = top();
          b = bottom();
          out.push(a[0], a[1], b[0], b[1]);
          break;
        case 10:
          a = top();
          b = right();
          c2 = bottom();
          d = left();
          out.push(a[0], a[1], b[0], b[1], c2[0], c2[1], d[0], d[1]);
          break;
        case 11:
          a = top();
          b = right();
          out.push(a[0], a[1], b[0], b[1]);
          break;
        case 12:
          a = left();
          b = right();
          out.push(a[0], a[1], b[0], b[1]);
          break;
        case 13:
          a = bottom();
          b = right();
          out.push(a[0], a[1], b[0], b[1]);
          break;
        case 14:
          a = left();
          b = bottom();
          out.push(a[0], a[1], b[0], b[1]);
          break;
      }
    }
  }
}

// ============================================================
// STITCH SEGMENTS INTO POLYLINES
// ============================================================
function stitchPolylines(segs: number[]) {
  const KEY_PRECISION = 1;
  const k = (x: number, y: number) =>
    `${Math.round(x / KEY_PRECISION)}|${Math.round(y / KEY_PRECISION)}`;
  const map = new Map<string, Array<{ seg: number; end: number }>>();
  const segCount = segs.length / 4;
  const used = new Uint8Array(segCount);

  for (let i = 0; i < segCount; i++) {
    const x1 = segs[i * 4],
      y1 = segs[i * 4 + 1];
    const x2 = segs[i * 4 + 2],
      y2 = segs[i * 4 + 3];
    const k1 = k(x1, y1),
      k2 = k(x2, y2);
    if (!map.has(k1)) map.set(k1, []);
    if (!map.has(k2)) map.set(k2, []);
    map.get(k1)!.push({ seg: i, end: 0 });
    map.get(k2)!.push({ seg: i, end: 1 });
  }

  const polylines: number[][] = [];

  const otherEnd = (segIdx: number, end: number): [number, number] => {
    if (end === 0) return [segs[segIdx * 4 + 2], segs[segIdx * 4 + 3]];
    return [segs[segIdx * 4], segs[segIdx * 4 + 1]];
  };

  for (let i = 0; i < segCount; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const line = [
      segs[i * 4],
      segs[i * 4 + 1],
      segs[i * 4 + 2],
      segs[i * 4 + 3],
    ];

    let curX = line[2],
      curY = line[3];
    for (let safety = 0; safety < 5000; safety++) {
      const bucket = map.get(k(curX, curY));
      if (!bucket) break;
      let next: { seg: number; end: number } | null = null;
      for (const entry of bucket) {
        if (!used[entry.seg]) {
          next = entry;
          break;
        }
      }
      if (!next) break;
      used[next.seg] = 1;
      const [nx, ny] = otherEnd(next.seg, next.end);
      line.push(nx, ny);
      curX = nx;
      curY = ny;
    }

    curX = line[0];
    curY = line[1];
    for (let safety = 0; safety < 5000; safety++) {
      const bucket = map.get(k(curX, curY));
      if (!bucket) break;
      let next: { seg: number; end: number } | null = null;
      for (const entry of bucket) {
        if (!used[entry.seg]) {
          next = entry;
          break;
        }
      }
      if (!next) break;
      used[next.seg] = 1;
      const [nx, ny] = otherEnd(next.seg, next.end);
      line.unshift(nx, ny);
      curX = nx;
      curY = ny;
    }

    polylines.push(line);
  }
  return polylines;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function Terrain({
  preset = "gruvbox",
  className,
}: TerrainProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rafRef = React.useRef(0);
  const startRef = React.useRef<number>(0);
  const theme = useStore(globalRigStore, (s) => s.settings.theme) as
    | TerrainPreset
    | undefined;
  const tweaks = PRESETS[theme ?? preset] ?? PRESETS[preset];

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    startRef.current = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0,
      h = 0;
    let cols = 0,
      rows = 0;
    let field: Float32Array | null = null;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cell = tweaks.detail;
      cols = Math.ceil(w / cell) + 2;
      rows = Math.ceil(h / cell) + 2;
      field = new Float32Array(cols * rows);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      if (!field) return;
      const t = (performance.now() - startRef.current) / 1000;
      const cellW = w / (cols - 2);
      const cellH = h / (rows - 2);

      const noiseScale = tweaks.scale;
      const speed = tweaks.speed;
      const octaves = tweaks.octaves;
      const tz = t * speed;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const nx = (x * cellW) / noiseScale;
          const ny = (y * cellH) / noiseScale;
          field[y * cols + x] = Noise.fbm(nx, ny, tz, octaves);
        }
      }

      ctx.fillStyle = tweaks.background;
      ctx.fillRect(0, 0, w, h);

      if (tweaks.vignette) {
        const grd = ctx.createRadialGradient(
          w / 2,
          h / 2,
          Math.min(w, h) * 0.2,
          w / 2,
          h / 2,
          Math.max(w, h) * 0.75,
        );
        grd.addColorStop(0, "rgba(0,0,0,0)");
        grd.addColorStop(1, "rgba(0,0,0,0.55)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
      }

      const levels = tweaks.levels;
      const lineColor = tweaks.lineColor;
      const baseAlpha = tweaks.lineAlpha;
      const lineWidth = tweaks.lineWidth;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let li = 0; li < levels; li++) {
        const range = 0.7;
        const threshold = (li / (levels - 1) - 0.5) * 2 * range;

        const segs: number[] = [];
        marchSegments(field, cols, rows, cellW, cellH, threshold, segs);
        const lines = stitchPolylines(segs);

        const t01 = li / (levels - 1);
        const aMod = 0.55 + 0.45 * Math.sin(Math.PI * t01);
        ctx.globalAlpha = baseAlpha * aMod;
        ctx.strokeStyle = lineColor;
        const isMajor = li % 4 === 0;
        ctx.lineWidth = isMajor ? lineWidth * 1.6 : lineWidth;

        for (const poly of lines) {
          if (poly.length < 4) continue;
          ctx.beginPath();
          ctx.moveTo(poly[0], poly[1]);
          for (let i = 2; i < poly.length; i += 2) {
            ctx.lineTo(poly[i], poly[i + 1]);
          }
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      if (tweaks.sweep) {
        const sweepX = (Math.sin(t * 0.25) * 0.5 + 0.5) * w;
        const grd = ctx.createLinearGradient(sweepX - 200, 0, sweepX + 200, 0);
        grd.addColorStop(0, "rgba(0,0,0,0)");
        grd.addColorStop(0.5, tweaks.sweepColor);
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = grd;
        ctx.globalAlpha = 0.18;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [tweaks]);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}

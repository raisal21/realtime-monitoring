"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, Input } from "@/components/core";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════
   TOPOGRAPHIC CONTOUR CANVAS
   Animated iso-contour lines that breathe and shift like a
   living geological map — driven by multi-octave sine noise
   (a smooth, GPU-free substitute for Perlin noise).

   Design notes
   ─────────────
   • A single underlying noise field f(x, y, t) is sampled
     for every contour band — adjacent lines are correlated,
     so they deform coherently (realistic topo behaviour).
   • Every 4th line is an "index contour": slightly brighter
     and thicker, matching cartographic convention.
   • Each line pulses gently in alpha over a different period
     so the map never feels static.
   • Lines are drawn with quadratic smoothing for silky curves.
═══════════════════════════════════════════════════════════ */

function useTopoContours(canvasRef: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let W = 0,
      H = 0;
    let raf: number;
    let time = 0;

    // Accent colour — matches existing theme throughout the file
    const R = 131,
      G = 165,
      B = 152;

    // ── Tuning ──────────────────────────────────────────────
    const CONTOUR_COUNT = 14; // total iso-lines
    const INDEX_EVERY = 4; // every Nth line is an index contour
    const X_STEP = 6; // px between sample points (lower = smoother)
    const TIME_RATE = 0.00018; // how fast the field evolves
    const SPATIAL_FREQ_X = 2.8; // horizontal spatial frequency of the noise
    const SPATIAL_FREQ_Y = 0.38; // vertical coherence between adjacent lines
    const MAX_AMPLITUDE = 52; // max vertical displacement in px

    // ── Multi-octave sine noise ──────────────────────────────
    // 4 octaves with irrational frequency ratios → aperiodic,
    // organic-feeling surface that never visibly tiles.
    function noise(x: number, y: number): number {
      const v =
        Math.sin(x * 1.0 + y * 2.317) * 0.5 +
        Math.sin(x * 2.718 + y * 4.669 + 1.5708) * 0.25 +
        Math.sin(x * 6.283 + y * 9.001 + 0.7854) * 0.125 +
        Math.sin(x * 13.71 + y * 18.85 + 3.1416) * 0.0625;
      // Normalise to [-1, 1]
      return v / (0.5 + 0.25 + 0.125 + 0.0625);
    }

    // ── Resize ───────────────────────────────────────────────
    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    // ── Draw one contour line ────────────────────────────────
    function drawContour(c: number) {
      const isIndex = c % INDEX_EVERY === 0;

      // Base y for this contour band — spread evenly with slight padding
      const baseY = H * (0.05 + (c / (CONTOUR_COUNT - 1)) * 0.9);

      // Amplitude scales with depth (deeper = wider excursions)
      const amplitude = MAX_AMPLITUDE * (0.4 + (c / CONTOUR_COUNT) * 0.6);

      // Per-line alpha pulse (each line breathes at a different phase)
      const pulse = Math.sin(time * 0.8 + c * 0.61) * 0.5 + 0.5; // [0, 1]
      const baseAlpha = isIndex ? 0.055 : 0.032;
      const alpha = baseAlpha + pulse * (isIndex ? 0.035 : 0.018);

      ctx.beginPath();

      // Build sample array for smooth quadratic pass
      const pts: { x: number; y: number }[] = [];
      for (let xi = 0; xi <= W; xi += X_STEP) {
        const nx = (xi / W) * SPATIAL_FREQ_X + time;
        const ny = c * SPATIAL_FREQ_Y + time * 0.25;
        const displacement = noise(nx, ny) * amplitude;
        pts.push({ x: xi, y: baseY + displacement });
      }

      // First point
      ctx.moveTo(pts[0].x, pts[0].y);

      // Quadratic curves through midpoints → silky smooth
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) * 0.5;
        const my = (pts[i].y + pts[i + 1].y) * 0.5;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }

      // Close to the last point
      const last = pts[pts.length - 1];
      ctx.lineTo(last.x, last.y);

      ctx.strokeStyle = `rgba(${R},${G},${B},${alpha.toFixed(4)})`;
      ctx.lineWidth = isIndex ? 0.9 : 0.5;
      ctx.stroke();
    }

    // ── Main loop ────────────────────────────────────────────
    function frame() {
      ctx.clearRect(0, 0, W, H);
      time += TIME_RATE;

      for (let c = 0; c < CONTOUR_COUNT; c++) {
        drawContour(c);
      }

      raf = requestAnimationFrame(frame);
    }

    // ── Bootstrap ────────────────────────────────────────────
    const onResize = () => {
      resize();
    };
    window.addEventListener("resize", onResize);
    resize();
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [canvasRef]);
}

/* ═══════════════════════════════════════════════════════════
   RIG SVG — identical to original HTML, extracted as component
═══════════════════════════════════════════════════════════ */
function RigIllustration() {
  // Randomise star positions once on mount
  const stars = useRef(
    Array.from({ length: 24 }, () => ({
      cx: `${Math.random() * 96 + 2}%`,
      cy: `${Math.random() * 72}%`,
      r: Math.random() < 0.15 ? 1.3 : 0.7,
      alpha: (Math.random() * 0.45 + 0.1).toFixed(2),
      dur: `${(2 + Math.random() * 3.5).toFixed(2)}s`,
      delay: `${(Math.random() * 4).toFixed(2)}s`,
    })),
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden flex items-end justify-center",
        "border-b border-(--theme-border)",
      )}
      style={{
        height: 180,
        background: "linear-gradient(180deg,#0b0d0f 0%,var(--theme-base) 100%)",
      }}
    >
      {/* Atmosphere radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 50% 0%,rgba(131,165,152,.07) 0%,transparent 70%)",
        }}
      />

      {/* Stars */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        {stars.current.map((s, i) => (
          <circle
            key={i}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill={`rgba(235,219,178,${s.alpha})`}
            style={{
              animation: `twinkle ${s.dur} ease-in-out infinite`,
              animationDelay: s.delay,
            }}
          />
        ))}
      </svg>

      {/* Rig SVG */}
      <svg
        viewBox="0 0 220 168"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "relative", zIndex: 2, width: 220, flexShrink: 0 }}
        aria-label="Oil rig derrick illustration"
      >
        {/* Derrick legs */}
        <line
          x1="110"
          y1="12"
          x2="76"
          y2="163"
          stroke="#3a444e"
          strokeWidth="2.2"
        />
        <line
          x1="110"
          y1="12"
          x2="144"
          y2="163"
          stroke="#3a444e"
          strokeWidth="2.2"
        />

        {/* Horizontals */}
        <line
          x1="82"
          y1="52"
          x2="138"
          y2="52"
          stroke="#2e3840"
          strokeWidth="1.2"
        />
        <line
          x1="78"
          y1="90"
          x2="142"
          y2="90"
          stroke="#2e3840"
          strokeWidth="1.2"
        />
        <line
          x1="74"
          y1="128"
          x2="146"
          y2="128"
          stroke="#2e3840"
          strokeWidth="1.2"
        />

        {/* X bracing */}
        <line
          x1="82"
          y1="52"
          x2="142"
          y2="90"
          stroke="#252d34"
          strokeWidth=".9"
        />
        <line
          x1="138"
          y1="52"
          x2="78"
          y2="90"
          stroke="#252d34"
          strokeWidth=".9"
        />
        <line
          x1="78"
          y1="90"
          x2="146"
          y2="128"
          stroke="#252d34"
          strokeWidth=".9"
        />
        <line
          x1="142"
          y1="90"
          x2="74"
          y2="128"
          stroke="#252d34"
          strokeWidth=".9"
        />

        {/* Crown + travelling block */}
        <rect
          x="99"
          y="5"
          width="22"
          height="9"
          rx="1.5"
          fill="#2e3840"
          stroke="#3a444e"
          strokeWidth="1"
        />
        <rect
          x="103"
          y="30"
          width="14"
          height="11"
          rx="1"
          fill="#252d34"
          stroke="#3a444e"
          strokeWidth=".8"
        />
        <line
          x1="110"
          y1="14"
          x2="110"
          y2="30"
          stroke="#3a444e"
          strokeWidth="1.2"
        />

        {/* Drill string */}
        <line
          x1="110"
          y1="41"
          x2="110"
          y2="163"
          stroke="#2e3840"
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />

        {/* Substructure */}
        <rect
          x="60"
          y="148"
          width="100"
          height="16"
          rx="1"
          fill="#1e2428"
          stroke="#2e3840"
          strokeWidth="1"
        />
        <rect
          x="63"
          y="148"
          width="9"
          height="16"
          fill="#191b1e"
          stroke="#252d34"
          strokeWidth=".7"
        />
        <rect
          x="148"
          y="148"
          width="9"
          height="16"
          fill="#191b1e"
          stroke="#252d34"
          strokeWidth=".7"
        />

        {/* Drawworks */}
        <rect
          x="18"
          y="154"
          width="36"
          height="12"
          rx="1"
          fill="#1e2428"
          stroke="#2e3840"
          strokeWidth="1"
        />
        <rect x="22" y="157" width="10" height="6" rx="1" fill="#252d34" />
        <rect x="34" y="157" width="10" height="6" rx="1" fill="#252d34" />

        {/* Pipe rack */}
        <rect
          x="166"
          y="155"
          width="30"
          height="10"
          rx="1"
          fill="#1e2428"
          stroke="#2e3840"
          strokeWidth="1"
        />
        <line
          x1="168"
          y1="159"
          x2="194"
          y2="159"
          stroke="#2e3840"
          strokeWidth=".8"
        />
        <line
          x1="168"
          y1="163"
          x2="194"
          y2="163"
          stroke="#2e3840"
          strokeWidth=".8"
        />

        {/* Flare stack */}
        <line
          x1="28"
          y1="163"
          x2="28"
          y2="124"
          stroke="#3a444e"
          strokeWidth="1.5"
        />
        <line
          x1="28"
          y1="124"
          x2="16"
          y2="108"
          stroke="#3a444e"
          strokeWidth="1.2"
        />
        <ellipse
          cx="14"
          cy="104"
          rx="3.5"
          ry="5"
          fill="#fe8019"
          opacity=".68"
          style={{
            animation: "flame 1.4s ease-in-out infinite",
            transformOrigin: "14px 109px",
          }}
        />
        <ellipse
          cx="14"
          cy="102"
          rx="2"
          ry="3.5"
          fill="#fabd2f"
          opacity=".5"
          style={{
            animation: "flame 1.4s ease-in-out infinite .25s",
            transformOrigin: "14px 106px",
          }}
        />

        {/* V-door */}
        <line
          x1="60"
          y1="163"
          x2="30"
          y2="155"
          stroke="#2e3840"
          strokeWidth="1.5"
        />

        {/* Navigation lights */}
        <circle
          cx="110"
          cy="8"
          r="2.2"
          fill="#fb4934"
          style={{ animation: "blink 2.4s ease-in-out infinite" }}
        />
        <circle
          cx="87"
          cy="50"
          r="1.4"
          fill="#fabd2f"
          opacity=".7"
          style={{ animation: "blink 3.2s ease-in-out infinite .6s" }}
        />
        <circle
          cx="133"
          cy="50"
          r="1.4"
          fill="#fabd2f"
          opacity=".7"
          style={{ animation: "blink 3.2s ease-in-out infinite 1.1s" }}
        />
      </svg>

      {/* Ground glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 animate-glow-pulse pointer-events-none"
        style={{
          width: 180,
          height: 24,
          background:
            "radial-gradient(ellipse 100% 100% at 50% 100%,rgba(131,165,152,.22),transparent)",
          filter: "blur(9px)",
        }}
      />

      {/* Ground line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg,transparent,var(--theme-border) 20%,var(--theme-border) 80%,transparent)",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AUTH PAGE
═══════════════════════════════════════════════════════════ */
export default function AuthPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pwVis, setPwVis] = useState(false);

  // Attach topographic contour animation
  useTopoContours(canvasRef as React.RefObject<HTMLCanvasElement>);

  return (
    <>
      {/* ── Screen guard ── */}
      <div className="screen-guard">
        <span className="text-[34px] opacity-40">🖥</span>
        <span className="section-heading text-[16px]">
          Large Display Required
        </span>
        <span
          className={cn(
            "font-['Barlow',sans-serif] text-[12px] text-(--theme-fg-muted)",
            "max-w-[300px] text-center leading-relaxed",
          )}
        >
          This enterprise control room is engineered for large displays. Please
          open on a desktop or laptop.
        </span>
        <span
          className={cn(
            "font-['Share_Tech_Mono',monospace] text-[11px] text-(--theme-accent)",
            "px-[12px] py-[3px] border border-(--theme-accent)",
            "opacity-60 rounded-(--radius-badge)",
          )}
        >
          Min. 1024 × 768 px
        </span>
      </div>

      {/* ── Constellation canvas (full-page background) ── */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0"
        aria-hidden="true"
      />

      {/* ── Centered card ── */}
      <div className="relative z-10 w-screen h-screen flex items-center justify-center">
        <div
          className={cn("glass animate-fade-up overflow-hidden", "w-[400px]")}
        >
          {/* Rig illustration header */}
          <RigIllustration />

          {/* Form body */}
          <div className="px-[34px] py-[30px]">
            {/* Brand row */}
            <div className="flex items-center gap-[9px] mb-[24px]">
              <div
                className={cn(
                  "w-[25px] h-[25px] rounded-[3px]",
                  "border border-(--theme-accent)",
                  "flex items-center justify-center flex-shrink-0",
                  "font-['Share_Tech_Mono',monospace] text-[11px] text-(--theme-accent)",
                )}
              >
                R
              </div>
              <span className="brand-title">RTDC</span>
              <div className="w-px h-[14px] bg-(--theme-border)" />
              <span className="label-mono">Control Room</span>
            </div>

            {/* Heading */}
            <h1
              className={cn(
                "font-['Barlow_Condensed',sans-serif] text-[23px] font-bold",
                "tracking-[0.03em] text-(--theme-fg) mb-[3px]",
              )}
            >
              Sign In
            </h1>
            <p
              className={cn(
                "font-['Barlow',sans-serif] text-[12px] font-light",
                "text-(--theme-fg-muted) leading-relaxed mb-[26px]",
              )}
            >
              Enter your credentials to access the live monitoring center.
            </p>

            {/* Email field */}
            <div className="mb-[13px]">
              <label className="field-label">Email</label>
              <Input
                type="email"
                placeholder="operator@company.com"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={
                  <span
                    className="text-(--theme-fg-dim)"
                    style={{ fontSize: 12 }}
                    aria-hidden="true"
                  >
                    ✉
                  </span>
                }
              />
            </div>

            {/* Password field */}
            <div className="mb-[8px]">
              <label className="field-label">Password</label>
              <Input
                type={pwVis ? "text" : "password"}
                placeholder="••••••••"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                icon={
                  <span
                    className="text-(--theme-fg-dim)"
                    style={{ fontSize: 13 }}
                    aria-hidden="true"
                  >
                    ⚿
                  </span>
                }
                // Append show/hide toggle via wrapperClassName trick — handled
                // via absolute button inside the relative wrapper
                wrapperClassName="group"
              />
              {/* Show / hide toggle — sits outside Input but visually inside */}
              <div className="relative -mt-[33px] flex justify-end pr-[10px] pointer-events-none">
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => setPwVis((v) => !v)}
                  className={cn(
                    "pointer-events-auto",
                    "font-['Share_Tech_Mono',monospace] text-[9px] uppercase",
                    "tracking-[0.1em] text-(--theme-fg-dim)",
                    "hover:text-(--theme-accent) transition-colors duration-150",
                  )}
                  aria-label={pwVis ? "Hide password" : "Show password"}
                >
                  {pwVis ? "HIDE" : "SHOW"}
                </button>
              </div>
              {/* Spacer to restore flow after the -mt trick */}
              <div className="mt-[33px]" />
            </div>

            {/* Submit */}
            <Button
              intent="primary"
              size="xl"
              fullWidth
              type="submit"
              className="mt-[8px]"
            >
              Enter Control Room
              <span
                className="transition-transform duration-200 group-hover:translate-x-[3px]"
                aria-hidden="true"
              >
                →
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Footer stamp ── */}
      <div
        className={cn(
          "fixed bottom-[20px] left-1/2 -translate-x-1/2 z-10",
          "font-['Share_Tech_Mono',monospace] text-[10px]",
          "text-(--theme-fg-dim) tracking-[0.08em] whitespace-nowrap",
          "animate-fade-up [animation-delay:300ms]",
        )}
      >
        RTDC v0.1.0-alpha · Alpha-1 Well · Block 7G
      </div>
    </>
  );
}

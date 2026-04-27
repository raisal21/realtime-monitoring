"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, Input } from "@/components/core";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════
   CONSTELLATION CANVAS
   Single accent color throughout.
   On hover: lines connected to nearby nodes are SEVERED
   (not drawn). Nodes near cursor grow and brighten.
═══════════════════════════════════════════════════════════ */

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number; // base alpha
}

function useConstellation(canvasRef: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let W = 0,
      H = 0;
    let nodes: Node[] = [];
    let raf: number;
    const mouse = { x: -9999, y: -9999 };

    // Tuning constants
    const N = 82; // node count
    const LDIST = 150; // max distance for a line to exist
    const HDIST = 120; // hover influence radius
    const LD2 = LDIST * LDIST;
    const HD2 = HDIST * HDIST;
    const SPEED = 0.24;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function init() {
      nodes = [];
      for (let i = 0; i < N; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * SPEED,
          vy: (Math.random() - 0.5) * SPEED,
          r: Math.random() < 0.12 ? 2.8 : Math.random() < 0.25 ? 1.9 : 1.3,
          a: Math.random() * 0.28 + 0.1,
        });
      }
    }

    function d2(ax: number, ay: number, bx: number, by: number) {
      const dx = ax - bx,
        dy = ay - by;
      return dx * dx + dy * dy;
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);

      // Move nodes — wrap at edges
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = W + 20;
        else if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20;
        else if (n.y > H + 20) n.y = -20;
      }

      // Pre-compute which nodes are "near" the cursor
      const nearSet = new Set<number>();
      for (let i = 0; i < nodes.length; i++) {
        if (d2(mouse.x, mouse.y, nodes[i].x, nodes[i].y) < HD2) {
          nearSet.add(i);
        }
      }

      // Draw lines — SKIP if EITHER endpoint is near cursor (sever effect)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          // Hover sever: if one or both endpoints are in the repulsion zone, skip
          if (nearSet.has(i) || nearSet.has(j)) continue;

          const dd = d2(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
          if (dd > LD2) continue;

          const t = 1 - Math.sqrt(dd) / LDIST; // proximity ratio [0, 1]
          const al = t * 0.11; // single restrained alpha

          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          // Single accent color — reads from CSS var at runtime
          ctx.strokeStyle = `rgba(131,165,152,${al})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const near = nearSet.has(i);

        // Scale and alpha: near nodes grow + brighten
        const dist = Math.sqrt(d2(mouse.x, mouse.y, n.x, n.y));
        const t = near ? Math.max(0, 1 - dist / HDIST) : 0;
        const sc = 1 + t * 2.2;
        const al = near ? Math.min(1, n.a + t * 0.7) : n.a;

        // Subtle glow halo for near nodes
        if (near && t > 0.15) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * sc * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(131,165,152,${t * 0.06})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * sc, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(131,165,152,${al})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    // Event listeners
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    resize();
    init();
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
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

  // Attach constellation
  useConstellation(canvasRef as React.RefObject<HTMLCanvasElement>);

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

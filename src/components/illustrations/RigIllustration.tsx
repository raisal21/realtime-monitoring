"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function RigIllustration() {
  const stars = React.useRef(
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

export default RigIllustration;

import { cn } from "@/lib/utils";

export type PulseRTone = "default" | "solid" | "print";
export type PulseRStatus = "ok" | "warning" | "critical" | "info";

export interface PulseRProps {
  size?: number;
  tone?: PulseRTone;
  status?: PulseRStatus;
  pulse?: boolean;
  className?: string;
}

const statusColorMap: Record<PulseRStatus, string> = {
  ok: "#b8bb26",
  warning: "#fabd2f",
  critical: "#fb4934",
  info: "#83a598",
};

const printFg = "#1d2021";
const printAccent = "#5b7a72";

export default function PulseR({
  size = 64,
  tone = "default",
  status = "info",
  pulse = false,
  className,
}: PulseRProps) {
  const accentColor = tone === "print" ? printAccent : statusColorMap[status];
  const fgColor = tone === "print" ? printFg : tone === "solid" ? "#ebdbb2" : "#ebdbb2";
  const scanOpacity = tone === "print" ? 0.85 : 0.85;
  const dimOpacity1 = tone === "print" ? 0.5 : 0.5;
  const dimOpacity2 = tone === "print" ? 0.25 : 0.25;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      shape-rendering="crispEdges"
      className={cn(pulse && "animate-pulse", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill={fgColor}>
        <rect x="10" y="10" width="6" height="44" />
        <rect x="10" y="10" width="26" height="6" />
        <rect x="10" y="29" width="26" height="6" />
        <rect x="30" y="16" width="6" height="13" />
        <path d="M22 35 L28 35 L40 54 L34 54 Z" />
      </g>
      <line
        x1="2" y1="40" x2="62" y2="40"
        stroke={accentColor}
        stroke-width="1.5"
        opacity={scanOpacity}
      />
      <rect x="44" y="20" width="3" height="3" fill={accentColor} />
      <rect x="50" y="20" width="3" height="3" fill={fgColor} opacity={dimOpacity1} />
      <rect x="56" y="20" width="3" height="3" fill={fgColor} opacity={dimOpacity2} />
    </svg>
  );
}

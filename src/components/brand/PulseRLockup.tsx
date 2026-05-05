import { cn } from "@/lib/utils";
import PulseR from "./PulseR";
import type { PulseRProps } from "./PulseR";

export interface PulseRLockupProps extends Omit<PulseRProps, "size"> {
  size?: number;
  showTagline?: boolean;
  tagline?: string;
  className?: string;
}

export default function PulseRLockup({
  size = 44,
  tone,
  status,
  pulse = false,
  showTagline = true,
  tagline = "Realtime Drilling Control",
  className,
}: PulseRLockupProps) {
  const nameSize = Math.round(size * 0.73);
  const tagSize = Math.round(size * 0.23);

  return (
    <div className={cn("inline-flex items-center gap-3.5", className)}>
      <PulseR size={size} tone={tone} status={status} pulse={pulse} />
      <span className="flex flex-col leading-none">
        <span
          className="font-['Barlow_Condensed',sans-serif] font-extrabold tracking-[0.18em] uppercase text-(--theme-fg-emphasis)"
          style={{ fontSize: `${nameSize}px` }}
        >
          RTDC
        </span>
        {showTagline && (
          <span
            className="font-['Share_Tech_Mono',monospace] tracking-[0.22em] uppercase text-(--theme-fg-dim) mt-1"
            style={{ fontSize: `${tagSize}px` }}
          >
            {tagline}
          </span>
        )}
      </span>
    </div>
  );
}

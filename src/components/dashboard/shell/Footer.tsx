import { AlarmTicker } from "@/components/dashboard/shell/AlarmTicker";
import { CURRENT_WELL } from "@/data/dashboard-static";
import { FooterStat } from "@/components/footer";
import { cn } from "@/lib/utils";

export function Footer({ droppedFrames = 0 }: { droppedFrames?: number }) {
  return (
    <footer
      className={cn(
        "flex items-center px-4 gap-4 flex-shrink-0 z-10 h-rt-shell-foot",
        "bg-(--theme-base) border-t border-(--theme-border)",
        "overflow-hidden",
      )}
    >
      <span
        className={cn(
          "font-['Share_Tech_Mono',monospace] text-fs-9 tracking-[0.06em]",
          "text-(--theme-fg-dim) shrink-0",
        )}
      >
        RTDC v0.2.0-alpha · {CURRENT_WELL.name} · © 2025
      </span>

      <AlarmTicker />

      <div className="flex items-center gap-3 shrink-0 ml-auto">
        <FooterStat value="48 ms" label="Ping" />
        <FooterStat value={`${droppedFrames} frames`} label="Dropped" />
        <FooterStat value="—" label="Retry" />
      </div>
    </footer>
  );
}

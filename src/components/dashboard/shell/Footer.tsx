import { AlarmTicker } from "./AlarmTicker";
import { CURRENT_WELL } from "../../../data/dashboard-static";
import { FooterStat, cn } from "../../../components";

export function Footer() {
  return (
    <footer
      className={cn(
        "flex items-center px-4 gap-4 flex-shrink-0 z-10",
        "bg-(--theme-base) border-t border-(--theme-border)",
        "overflow-hidden",
      )}
      style={{ height: 28 }}
    >
      <span
        className={cn(
          "font-['Share_Tech_Mono',monospace] text-[9px] tracking-[0.06em]",
          "text-(--theme-fg-dim) shrink-0",
        )}
      >
        RTDC v0.2.0-alpha · {CURRENT_WELL.name} · © 2025
      </span>

      <AlarmTicker />

      <div className="flex items-center gap-3 shrink-0">
        <FooterStat value="48 ms" label="Ping" />
        <FooterStat value="0 frames" label="Dropped" />
        <FooterStat value="—" label="Retry" />
      </div>
    </footer>
  );
}
import { AlarmTicker } from "@/components/dashboard/shell/AlarmTicker";
import { FIELD_INFO } from "@/data/dashboard-static";
import { useCurrentWell } from "@/contexts/CurrentWellContext";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_FEATURES } from "@/config/role";
import { cn } from "@/lib/utils";
import PulseR from "@/components/brand/PulseR";

export function Footer() {
  const { well } = useCurrentWell();
  const { role } = useAuth();
  const showTicker = role ? ROLE_FEATURES[role].alarmTicker : false;

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
          "inline-flex items-center gap-1",
          "font-['Share_Tech_Mono',monospace] text-fs-9 tracking-[0.06em]",
          "text-(--theme-fg-dim) shrink-0",
        )}
      >
        <PulseR size={10} />
        RTDC v0.2.0-alpha · {well?.name ?? "—"} · {FIELD_INFO.field} · © 2026
      </span>

      {showTicker && <AlarmTicker />}
    </footer>
  );
}

import { useMemo } from "react";
import { Bell, Settings as SettingsIcon, CircleUser, ChevronRight } from "lucide-react";
import { useUi } from "@/stores/dashboard-store";
import { FEED_ITEMS, CURRENT_WELL } from "@/data/dashboard-static";
import { Popover, PopoverTrigger } from "@/components/popover";
import { TopbarButton } from "@/components/navigation";
import { BreadcrumbItem } from "@/components/navigation";
import { ConnectionStatus } from "@/components/footer";
import { cn } from "@/lib/utils";
import { SettingsPopoverContent } from "@/components/dashboard/popovers/SettingsPopover";

export function UniversalTopbar() {
  const { state: ui, dispatch } = useUi();
  const unackedCritical = useMemo(
    () =>
      FEED_ITEMS.filter(
        (f) => f.state === "unacked" && f.severity === "critical",
      ).length,
    [],
  );
  const totalUnacked = useMemo(
    () => FEED_ITEMS.filter((f) => f.state === "unacked").length,
    [],
  );

  return (
    <header
      className={cn(
        "flex items-center px-4 gap-0 z-50 flex-shrink-0",
        "bg-(--theme-elevated) border-b border-(--theme-border)",
      )}
      style={{ height: 44 }}
    >
      <div className="flex items-center gap-2.5 pr-4 mr-4 border-r border-(--theme-border) flex-shrink-0">
        <div
          className={cn(
            "w-7 h-7 rounded-(--radius-badge)",
            "bg-(--theme-accent) flex items-center justify-center flex-shrink-0",
            "font-['Share_Tech_Mono',monospace] text-[12px] font-bold text-(--theme-base)",
          )}
        >
          R
        </div>
        <div className="flex flex-col leading-tight">
          <span className="brand-title text-[13px] leading-none">RTDC</span>
          <span className="label-mono leading-none mt-0.5">Control Room</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <BreadcrumbItem type="link">Wells</BreadcrumbItem>
        <BreadcrumbItem type="separator">
          <ChevronRight size={13} strokeWidth={2} />
        </BreadcrumbItem>
        <BreadcrumbItem type="link">{CURRENT_WELL.name}</BreadcrumbItem>
        <BreadcrumbItem type="separator">
          <ChevronRight size={13} strokeWidth={2} />
        </BreadcrumbItem>
        <BreadcrumbItem type="current">Dashboard</BreadcrumbItem>
      </div>

      <div className="flex-1" />

      <ConnectionStatus status="online" className="mr-3" />

      <div className="flex items-center gap-1 pl-3 border-l border-(--theme-border)">
        <Popover
          open={ui.settingsPopover}
          onOpenChange={(open) =>
            dispatch({ type: "SET_SETTINGS_POPOVER", open })
          }
        >
          <PopoverTrigger
            render={
              <TopbarButton
                title="Settings (Cmd+K)"
                aria-label="Open settings"
                data-settings-trigger
              >
                <SettingsIcon size={16} strokeWidth={2} />
              </TopbarButton>
            }
          />
          <SettingsPopoverContent />
        </Popover>

        <TopbarButton
          intent={unackedCritical > 0 ? "alarm" : "default"}
          badgeCount={totalUnacked}
          title={`${totalUnacked} unacked alarms`}
          aria-label="Alarms"
          onClick={() => dispatch({ type: "TOGGLE_ALARM_SIDEBAR" })}
        >
          <Bell size={16} strokeWidth={2} />
        </TopbarButton>

        <TopbarButton title="User profile" aria-label="User profile">
          <CircleUser size={16} strokeWidth={2} />
        </TopbarButton>
      </div>
    </header>
  );
}
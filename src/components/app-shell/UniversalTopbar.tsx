import * as React from "react";
import { Settings as SettingsIcon, CircleUser, ChevronRight } from "lucide-react";
import { useLocation, useParams, Link } from "react-router-dom";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";
import { useOptionalCurrentWell } from "@/contexts/CurrentWellContext";
import { getWellName } from "@/data/wells";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { TopbarButton } from "@/components/ui/navigation";
import { BreadcrumbItem } from "@/components/ui/navigation";
import { ConnectionStatus } from "@/components/ui/status-bar";
import { cn } from "@/lib/utils";
import { SettingsPopoverContent } from "@/components/dashboard/popovers/SettingsPopover";
import PulseRLockup from "@/components/brand/PulseRLockup";

interface UniversalTopbarProps {
  hideBreadcrumbs?: boolean;
  hideConnectionStatus?: boolean;
  profileSlot?: React.ReactNode;
}

export function UniversalTopbar({
  hideBreadcrumbs,
  hideConnectionStatus,
  profileSlot,
}: UniversalTopbarProps) {
  const settingsPopover = useStore(
    globalRigStore,
    (s) => s.ui.settingsPopover,
  );
  const setSettingsPopover = useStore(
    globalRigStore,
    (s) => s.setSettingsPopover,
  );
  const location = useLocation();
  const params = useParams<{ wellId?: string }>();

  const isWellsPage = location.pathname.startsWith("/wells");
  const isDashboardPage = location.pathname.startsWith("/dashboard");

  const ctx = useOptionalCurrentWell();
  const activeWellId = ctx?.wellId ?? params.wellId;
  const wellName = activeWellId ? getWellName(activeWellId) : "";

  const showWellInBreadcrumb = isDashboardPage || (isWellsPage && !!ctx?.wellId);
  const showDashboardInBreadcrumb = isDashboardPage;

  const defaultProfile = (
    <TopbarButton title="User profile" aria-label="User profile">
      <CircleUser size={16} strokeWidth={2} />
    </TopbarButton>
  );

  const defaultSettings = (
    <Popover
      open={settingsPopover}
      onOpenChange={(open) => setSettingsPopover(open)}
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
  );

  return (
    <header
      className={cn(
        "flex items-center px-4 gap-0 z-50 flex-shrink-0 h-rt-shell-top",
        "bg-(--theme-elevated) border-b border-(--theme-border)",
      )}
    >
      <div className="flex items-center gap-2.5 pr-4 mr-4 border-r border-(--theme-border) flex-shrink-0">
        <PulseRLockup size={28} showTagline={false} />
        <div className="flex flex-col leading-tight">
          <span className="brand-title text-fs-13 leading-none">RTDC</span>
          <span className="label-mono leading-none mt-0.5">Control Room</span>
        </div>
      </div>

      {!hideBreadcrumbs && (
        <div className="flex items-center gap-1.5">
          <BreadcrumbItem type="link">
            <Link to="/wells" className="hover:inherit">Wells</Link>
          </BreadcrumbItem>

          {showWellInBreadcrumb && (
            <>
              <BreadcrumbItem type="separator">
                <ChevronRight size={13} strokeWidth={2} />
              </BreadcrumbItem>
              <BreadcrumbItem type={showDashboardInBreadcrumb ? "link" : "current"}>
                {showDashboardInBreadcrumb ? (
                  <Link to={`/wells/${activeWellId}`} className="hover:inherit">{wellName}</Link>
                ) : (
                  wellName
                )}
              </BreadcrumbItem>
            </>
          )}

          {showDashboardInBreadcrumb && (
            <>
              <BreadcrumbItem type="separator">
                <ChevronRight size={13} strokeWidth={2} />
              </BreadcrumbItem>
              <BreadcrumbItem type="current">Dashboard</BreadcrumbItem>
            </>
          )}

          {!showWellInBreadcrumb && !showDashboardInBreadcrumb && (
            <BreadcrumbItem type="current">Wells</BreadcrumbItem>
          )}
        </div>
      )}

      <div className="flex-1" />

      {!hideConnectionStatus && (
        <ConnectionStatus status="online" className="mr-3" />
      )}

      <div className="flex items-center gap-1 pl-3 border-l border-(--theme-border)">
        {defaultSettings}
        {profileSlot ?? defaultProfile}
      </div>
    </header>
  );
}

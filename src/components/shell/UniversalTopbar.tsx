import * as React from "react";
import { Settings as SettingsIcon, CircleUser, ChevronRight } from "lucide-react";
import { useLocation, useParams, Link } from "react-router-dom";
import { UiContext } from "@/stores/dashboard-store";
import { CURRENT_WELL } from "@/data/dashboard-static";
import { getWellName } from "@/data/wells";
import { Popover, PopoverTrigger } from "@/components/popover";
import { TopbarButton } from "@/components/navigation";
import { BreadcrumbItem } from "@/components/navigation";
import { ConnectionStatus } from "@/components/footer";
import { cn } from "@/lib/utils";
import { SettingsPopoverContent } from "@/components/dashboard/popovers/SettingsPopover";

interface UniversalTopbarProps {
  wellId?: string;
  /** Replace the default settings + user buttons with custom content */
  rightContent?: React.ReactNode;
  /** Hide the breadcrumb section entirely */
  hideBreadcrumbs?: boolean;
}

export function UniversalTopbar({ wellId, rightContent, hideBreadcrumbs }: UniversalTopbarProps) {
  const uiCtx = React.useContext(UiContext);
  const location = useLocation();
  const params = useParams<{ wellId?: string }>();

  const isWellsPage = location.pathname.startsWith("/wells");
  const isDashboardPage = location.pathname.startsWith("/dashboard");

  const activeWellId = wellId ?? params.wellId ?? CURRENT_WELL.id;
  const wellName = getWellName(activeWellId);

  const showWellInBreadcrumb = isDashboardPage || (isWellsPage && params.wellId);
  const showDashboardInBreadcrumb = isDashboardPage;

  return (
    <header
      className={cn(
        "flex items-center px-4 gap-0 z-50 flex-shrink-0 h-rt-shell-top",
        "bg-(--theme-elevated) border-b border-(--theme-border)",
      )}
    >
      <div className="flex items-center gap-2.5 pr-4 mr-4 border-r border-(--theme-border) flex-shrink-0">
        <div
          className={cn(
            "w-7 h-7 rounded-(--radius-badge)",
            "bg-(--theme-accent) flex items-center justify-center flex-shrink-0",
            "font-['Share_Tech_Mono',monospace] text-fs-12 font-bold text-(--theme-base)",
          )}
        >
          R
        </div>
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

      <ConnectionStatus status="online" className="mr-3" />

      <div className="flex items-center gap-1 pl-3 border-l border-(--theme-border)">
        {rightContent ?? (
          <>
            <Popover
              open={uiCtx?.state.settingsPopover ?? false}
              onOpenChange={(open) =>
                uiCtx?.dispatch({ type: "SET_SETTINGS_POPOVER", open })
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
              <SettingsPopoverContent hideAlarmSound />
            </Popover>

            <TopbarButton title="User profile" aria-label="User profile">
              <CircleUser size={16} strokeWidth={2} />
            </TopbarButton>
          </>
        )}
      </div>
    </header>
  );
}

"use client";

import * as React from "react";
import { Lock, Settings as SettingsIcon } from "lucide-react";
import Terrain from "@/components/ui/terrain";
import type { TerrainPreset } from "@/components/ui/terrain";
import { TopbarButton } from "@/components/navigation";
import { UniversalTopbar } from "@/components/dashboard/shell/UniversalTopbar";
import { Popover, PopoverTrigger } from "@/components/popover";
import { SettingsProvider } from "@/stores/dashboard-store";
import { SettingsPopoverContent } from "@/components/dashboard/popovers/SettingsPopover";
import AuthCard from "@/components/auth/AuthCard";

export interface AuthLayoutProps {
  onSignIn?: () => void;
  defaultPreset?: TerrainPreset;
}

export default function AuthLayout({
  onSignIn,
  defaultPreset = "gruvbox",
}: AuthLayoutProps) {
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const handleLoginClick = () => {
    const form = document.getElementById("login-form");
    form?.scrollIntoView({ behavior: "smooth", block: "center" });
    form?.querySelector("input")?.focus();
  };

  return (
    <SettingsProvider>
      {/* Screen guard */}
      <div className="screen-guard">
        <span className="text-[34px] opacity-40">🖥</span>
        <span className="section-heading text-[16px]">
          Large Display Required
        </span>
        <span className="font-['Barlow',sans-serif] text-fs-12 text-(--theme-fg-muted) max-w-[300px] text-center leading-relaxed">
          This enterprise control room is engineered for large displays. Please
          open on a desktop or laptop.
        </span>
        <span className="font-['Share_Tech_Mono',monospace] text-fs-11 text-(--theme-accent) px-[12px] py-[3px] border border-(--theme-accent) opacity-60 rounded-(--radius-badge)">
          Min. 1024 × 768 px
        </span>
      </div>

      <div className="flex flex-col h-screen overflow-hidden">
        {/* Topbar with settings and login shortcut */}
        <UniversalTopbar
          hideBreadcrumbs
          rightContent={
            <>
              <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                <PopoverTrigger
                  render={
                    <TopbarButton
                      title="Settings"
                      aria-label="Open settings"
                    >
                      <SettingsIcon size={16} strokeWidth={2} />
                    </TopbarButton>
                  }
                />
                <SettingsPopoverContent hideAlarmSound />
              </Popover>

              <TopbarButton
                onClick={handleLoginClick}
                title="Login"
                aria-label="Scroll to login form"
              >
                <Lock size={16} strokeWidth={2} />
                <span className="ml-1">Login</span>
              </TopbarButton>
            </>
          }
        />

        {/* Content area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Live contour terrain background */}
          <Terrain
            preset={defaultPreset}
            className="absolute inset-0"
          />

          {/* Centered card */}
          <div className="absolute inset-0 flex items-center justify-center p-rt-pad-lg z-10">
            <AuthCard onSignIn={onSignIn} />
          </div>
        </div>
      </div>
    </SettingsProvider>
  );
}

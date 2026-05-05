"use client";

import * as React from "react";
import { Lock, Settings as SettingsIcon } from "lucide-react";
import Terrain from "@/components/ui/terrain";
import type { TerrainPreset } from "@/components/ui/terrain";
import { TopbarButton } from "@/components/navigation";
import { UniversalTopbar } from "@/components/shell/UniversalTopbar";
import { Popover, PopoverTrigger } from "@/components/popover";
import { SettingsProvider } from "@/stores/dashboard-store";
import { SettingsPopoverContent } from "@/components/dashboard/popovers/SettingsPopover";
import AuthCard from "@/components/auth/AuthCard";

interface AuthProps {
  onSignIn?: () => void;
  defaultPreset?: TerrainPreset;
}

export default function Auth({
  onSignIn,
  defaultPreset = "gruvbox",
}: AuthProps) {
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const handleLoginClick = () => {
    const form = document.getElementById("login-form");
    form?.scrollIntoView({ behavior: "smooth", block: "center" });
    form?.querySelector("input")?.focus();
  };

  return (
    <SettingsProvider>
      <div className="flex flex-col h-screen overflow-hidden">
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

        <div className="flex-1 relative overflow-hidden">
          <Terrain preset={defaultPreset} className="absolute inset-0" />

          <div className="absolute inset-0 flex items-center justify-center p-rt-pad-lg z-10">
            <AuthCard onSignIn={onSignIn} />
          </div>
        </div>
      </div>
    </SettingsProvider>
  );
}

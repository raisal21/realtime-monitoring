"use client";

import { Lock } from "lucide-react";
import Terrain from "@/components/ui/terrain";
import type { TerrainPreset } from "@/components/ui/terrain";
import { TopbarButton } from "@/components/navigation";
import { UniversalTopbar } from "@/components/shell/UniversalTopbar";
import { SettingsProvider, UiProvider } from "@/stores/app-store";
import AuthCard from "@/components/auth/AuthCard";

interface AuthProps {
  onSignIn?: () => void;
  defaultPreset?: TerrainPreset;
}

export default function Auth({
  onSignIn,
  defaultPreset = "gruvbox",
}: AuthProps) {
  const handleLoginClick = () => {
    const form = document.getElementById("login-form");
    form?.scrollIntoView({ behavior: "smooth", block: "center" });
    form?.querySelector("input")?.focus();
  };

  return (
    <SettingsProvider>
      <UiProvider>
        <div className="flex flex-col h-screen overflow-hidden">
          <UniversalTopbar
            hideBreadcrumbs
            hideConnectionStatus
            profileSlot={
              <TopbarButton
                onClick={handleLoginClick}
                title="Login"
                aria-label="Scroll to login form"
              >
                <Lock size={16} strokeWidth={2} />
                <span className="ml-1">Login</span>
              </TopbarButton>
            }
          />

          <div className="flex-1 relative overflow-hidden">
            <Terrain preset={defaultPreset} className="absolute inset-0" />

            <div className="absolute inset-0 flex items-center justify-center p-rt-pad-lg z-10">
              <AuthCard onSignIn={onSignIn} />
            </div>
          </div>
        </div>
      </UiProvider>
    </SettingsProvider>
  );
}

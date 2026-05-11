"use client";

import { useRef } from "react";
import { Lock } from "lucide-react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import Terrain from "@/components/ui/Terrain";
import type { TerrainPreset } from "@/components/ui/Terrain";
import { TopbarButton } from "@/components/ui/navigation";
import { UniversalTopbar } from "@/components/app-shell/UniversalTopbar";
import AuthCard from "@/components/auth/AuthCard";
import { useAuth } from "@/hooks/useAuth";

interface AuthProps {
  onSignIn?: () => void;
  defaultPreset?: TerrainPreset;
}

export default function Auth({
  onSignIn,
  defaultPreset = "gruvbox",
}: AuthProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/wells";

  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleSignIn = () => {
    login();
    onSignIn?.();
    navigate(from, { replace: true });
  };

  const handleLoginClick = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => firstInputRef.current?.focus(), 300);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
          <UniversalTopbar
            hideBreadcrumbs
            hideConnectionStatus
            profileSlot={
              <TopbarButton
                size="sm"
                onClick={handleLoginClick}
                title="Login"
                aria-label="Scroll to login form"
              >
                <Lock size={14} strokeWidth={2} />
                <span className="ml-1">Login</span>
              </TopbarButton>
            }
          />

          <div className="flex-1 relative overflow-hidden">
            <Terrain preset={defaultPreset} className="absolute inset-0" />

            <div className="absolute inset-0 flex items-center justify-center p-rt-pad-lg z-10">
              <AuthCard
                onSignIn={handleSignIn}
                formRef={formRef}
                firstInputRef={firstInputRef}
              />
            </div>
          </div>
    </div>
  );
}

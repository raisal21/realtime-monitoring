"use client";

import { cn } from "@/lib/utils";
import RigIllustration from "@/components/illustrations/RigIllustration";
import LoginForm from "@/components/auth/LoginForm";
import PulseRLockup from "@/components/brand/PulseRLockup";
import PulseR from "@/components/brand/PulseR";

export interface AuthCardProps {
  onSignIn?: () => void;
}

export default function AuthCard({ onSignIn }: AuthCardProps) {
  return (
    <div
      className={cn(
        "glass animate-fade-up overflow-hidden",
        "w-full max-w-[400px]",
      )}
    >
      {/* Rig illustration header */}
      <RigIllustration />

      {/* Form body */}
      <div className="px-rt-pad py-rt-pad">
        {/* Brand row */}
        <div className="flex items-center gap-rt-gap-sm mb-rt-gap-sm">
          <PulseRLockup size={25} showTagline={false} />
          <div className="w-px h-[14px] bg-(--theme-border)" />
          <span className="label-mono">Control Room</span>
        </div>

        {/* Heading */}
        <h1
          className={cn(
            "font-['Barlow_Condensed',sans-serif] text-fs-24 font-bold",
            "tracking-[0.03em] text-(--theme-fg) mb-rt-pad-xs",
          )}
        >
          Control Room Sign-In
        </h1>
        <p
          className={cn(
            "font-['Barlow',sans-serif] text-fs-12 font-light",
            "text-(--theme-fg-muted) leading-relaxed mb-rt-pad",
          )}
        >
          Operator credentials are scoped to a rig. Lost access? Your shift
          supervisor can re-issue a token from the field office.
        </p>

        {/* Form */}
        <LoginForm onSignIn={onSignIn} />

        {/* Footer stamp */}
        <div
          className={cn(
            "flex items-center justify-center gap-rt-gap-sm mt-rt-gap",
            "font-['Share_Tech_Mono',monospace] text-fs-10",
            "text-(--theme-fg-dim) tracking-[0.08em]",
          )}
        >
          <span className="inline-flex items-center gap-1">
            <PulseR size={12} />
            RTDC v0.2.0-alpha
          </span>
          <span className="text-(--theme-border)">·</span>
          <span>Guntur Geothermal Field · Garut, West Java</span>
        </div>
      </div>
    </div>
  );
}

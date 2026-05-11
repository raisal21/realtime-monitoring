import { useState } from "react";
import { useStore } from "zustand";
import { X, RefreshCw } from "lucide-react";
import { globalRigStore } from "@/store/index-store";
import { cn } from "@/lib/utils";

export function ErrorBanner() {
  const status = useStore(globalRigStore, (s) => s.status);
  const error = useStore(globalRigStore, (s) => s.error);
  const triggerRetry = useStore(globalRigStore, (s) => s.triggerRetry);
  const [dismissed, setDismissed] = useState(false);

  if (status !== "ERROR" || dismissed) return null;

  const code = error?.code ?? "UNKNOWN_ERROR";
  const reason = error?.reason ?? "Connection lost";

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 px-4 py-2",
        "border-b",
        "text-(--theme-critical)",
        "bg-[color-mix(in_srgb,var(--theme-critical)_12%,transparent)]",
        "border-[color-mix(in_srgb,var(--theme-critical)_35%,transparent)]",
        "font-['Share_Tech_Mono',monospace] text-fs-10",
      )}
    >
      <span className="uppercase tracking-[0.1em] font-bold">{code}</span>
      <span className="text-(--theme-fg-muted) flex-1 truncate">{reason}</span>
      <button
        type="button"
        onClick={() => {
          setDismissed(false);
          triggerRetry();
        }}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-(--radius-badge)",
          "border border-current cursor-pointer",
          "hover:bg-[color-mix(in_srgb,var(--theme-critical)_20%,transparent)]",
        )}
      >
        <RefreshCw size={12} strokeWidth={2} />
        Retry
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="p-1 rounded-(--radius-badge) cursor-pointer hover:bg-[color-mix(in_srgb,var(--theme-critical)_20%,transparent)]"
      >
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  );
}

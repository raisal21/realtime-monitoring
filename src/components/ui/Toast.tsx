import { useEffect } from "react";
import { useStore } from "zustand";
import { globalRigStore } from "@/store/index-store";
import { cn } from "@/lib/utils";
import type { ToastEntry, ToastTone } from "@/store/slices/toast-slice";

const TOAST_TTL_MS = 6_000;

const TONE_CLASS: Record<ToastTone, string> = {
  error: [
    "text-(--theme-critical)",
    "bg-[color-mix(in_srgb,var(--theme-critical)_12%,transparent)]",
    "border-[color-mix(in_srgb,var(--theme-critical)_35%,transparent)]",
  ].join(" "),
  warning: [
    "text-(--theme-warning)",
    "bg-[color-mix(in_srgb,var(--theme-warning)_12%,transparent)]",
    "border-[color-mix(in_srgb,var(--theme-warning)_35%,transparent)]",
  ].join(" "),
  info: [
    "text-(--theme-fg-muted)",
    "bg-[color-mix(in_srgb,var(--theme-fg-muted)_10%,transparent)]",
    "border-[color-mix(in_srgb,var(--theme-fg-muted)_30%,transparent)]",
  ].join(" "),
};

interface ToastItemProps {
  toast: ToastEntry;
  onDismiss: (id: string) => void;
}

const ToastItem = ({ toast, onDismiss }: ToastItemProps) => {
  useEffect(() => {
    const t = window.setTimeout(() => onDismiss(toast.id), TOAST_TTL_MS);
    return () => window.clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <button
      type="button"
      onClick={() => onDismiss(toast.id)}
      className={cn(
        "flex flex-col items-start gap-1 max-w-[320px]",
        "px-3 py-2 rounded-(--radius-badge) border text-left",
        "font-['Share_Tech_Mono',monospace] text-fs-10",
        "cursor-pointer select-none",
        TONE_CLASS[toast.tone],
      )}
    >
      <span className="uppercase tracking-[0.1em] text-fs-9 opacity-80">
        {toast.code}
      </span>
      <span className="leading-snug">{toast.message}</span>
    </button>
  );
};

export const Toast = () => {
  const toasts = useStore(globalRigStore, (s) => s.toasts);
  const dismissToast = useStore(globalRigStore, (s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  );
};

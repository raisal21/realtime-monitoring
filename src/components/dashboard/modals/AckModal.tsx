import { TriangleAlert, X } from "lucide-react";
import { useUi } from "@/stores/dashboard-store";
import { FEED_ITEMS } from "@/data/dashboard-static";
import { Surface } from "@/components/core";
import { Button } from "@/components/core";
import { IconButton } from "@/components/form";
import { cn } from "@/lib/utils";

export function AckModal() {
  const { state: ui, dispatch } = useUi();
  if (!ui.ackModal.open) return null;

  const alarm = FEED_ITEMS.find((f) => f.id === ui.ackModal.alarmId);
  if (!alarm) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-[3px]"
      onClick={() => dispatch({ type: "CLOSE_ACK_MODAL" })}
    >
      <Surface
        elevation="elevated"
        outline="all"
        className="w-[400px] animate-fade-up shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-(--theme-border)">
          <TriangleAlert
            size={16}
            strokeWidth={2.25}
            className="text-(--theme-critical)"
          />
          <span className="font-['Barlow_Condensed',sans-serif] text-[14px] font-bold uppercase tracking-[0.08em] flex-1">
            Acknowledge Alarm
          </span>
          <IconButton
            intent="ghost"
            size="sm"
            onClick={() => dispatch({ type: "CLOSE_ACK_MODAL" })}
            aria-label="Close modal"
          >
            <X size={13} strokeWidth={2} />
          </IconButton>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3.5">
          <div
            className={cn(
              "px-3 py-2.5 rounded-(--radius-badge)",
              "bg-[color-mix(in_srgb,var(--theme-critical)_8%,transparent)]",
              "border border-[color-mix(in_srgb,var(--theme-critical)_30%,transparent)]",
            )}
          >
            <p className="font-['Barlow_Condensed',sans-serif] text-[13px] font-bold text-(--theme-critical) uppercase tracking-[0.04em]">
              {alarm.severity.toUpperCase()} — {alarm.message}
            </p>
            <p className="font-['Share_Tech_Mono',monospace] text-[10px] text-(--theme-fg-muted) mt-0.5">
              {alarm.meta} · Raised at {alarm.timestamp}
            </p>
          </div>

          <div>
            <label className="field-label">Operator Name</label>
            <input
              type="text"
              placeholder="Enter your name…"
              className="field-input font-['Barlow',sans-serif]"
            />
          </div>

          <div>
            <label className="field-label">Role</label>
            <input
              type="text"
              defaultValue="Driller"
              readOnly
              className="field-input font-['Barlow',sans-serif] opacity-60 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-(--theme-border)">
          <Button
            intent="ghost"
            size="md"
            onClick={() => dispatch({ type: "CLOSE_ACK_MODAL" })}
          >
            Cancel (Esc)
          </Button>
          <Button
            intent="primary"
            size="md"
            onClick={() => dispatch({ type: "CLOSE_ACK_MODAL" })}
          >
            Confirm ACK
          </Button>
        </div>
      </Surface>
    </div>
  );
}
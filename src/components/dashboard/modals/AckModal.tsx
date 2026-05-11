import { useState, useCallback, useRef, useEffect } from "react";
import { TriangleAlert, X } from "lucide-react";
import { useStore } from "zustand";
import { useUi } from "@/store/app-store";
import { globalRigStore } from "@/store/index-store";
import { useAuth } from "@/hooks/useAuth";
import { Surface } from "@/components/ui/core";
import { Button } from "@/components/ui/core";
import { IconButton } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export function AckModal() {
  const { state: ui, dispatch } = useUi();
  const { operatorName, role } = useAuth();
  const [confirmInput, setConfirmInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const alarm = useStore(
    globalRigStore,
    (s) => s.alarmRegistry.get(ui.ackModal.alarmId ?? ""),
  );

  const confirmEnabled = alarm ? confirmInput === alarm.code : false;

  const handleSubmit = useCallback(() => {
    if (!confirmEnabled || !alarm || !operatorName || !role) return;
    globalRigStore
      .getState()
      .ackAlarm(alarm.id, operatorName, role);
    setConfirmInput("");
    dispatch({ type: "CLOSE_ACK_MODAL" });
  }, [confirmEnabled, alarm, operatorName, role, dispatch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && confirmEnabled) {
        handleSubmit();
      }
    },
    [confirmEnabled, handleSubmit],
  );

  useEffect(() => {
    if (ui.ackModal.open) {
      inputRef.current?.focus();
    }
  }, [ui.ackModal.open]);

  if (!ui.ackModal.open) return null;

  if (!alarm) {
    dispatch({ type: "CLOSE_ACK_MODAL" });
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-[3px]"
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
          <span className="font-['Barlow_Condensed',sans-serif] text-fs-14 font-bold uppercase tracking-[0.08em] flex-1">
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
            <p className="font-['Barlow_Condensed',sans-serif] text-fs-13 font-bold text-(--theme-critical) uppercase tracking-[0.04em]">
              {alarm.severity} — {alarm.message}
            </p>
            <p className="font-['Share_Tech_Mono',monospace] text-fs-10 text-(--theme-fg-muted) mt-0.5">
              {alarm.code} · Raised at{" "}
              {new Date(alarm.timestamp).toTimeString().slice(0, 8)}
            </p>
          </div>

          <div>
            <label className="field-label">Operator Name</label>
            <input
              type="text"
              readOnly
              value={operatorName ?? ""}
              className="field-input font-['Barlow',sans-serif] opacity-60 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="field-label">Role</label>
            <input
              type="text"
              readOnly
              value={role ? role.toUpperCase() : ""}
              className="field-input font-['Barlow',sans-serif] opacity-60 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="field-label">
              Type{" "}
              <span className="font-bold text-(--theme-critical)">
                {alarm.code}
              </span>{" "}
              to confirm acknowledgement
            </label>
            <input
              ref={inputRef}
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Type ${alarm.code}…`}
              className="field-input font-['Barlow',sans-serif]"
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
            intent="danger"
            size="md"
            disabled={!confirmEnabled}
            onClick={handleSubmit}
          >
            Confirm ACK
          </Button>
        </div>
      </Surface>
    </div>
  );
}

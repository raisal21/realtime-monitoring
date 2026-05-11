import React, { useMemo, useEffect, useRef } from "react";
import { useSettings } from "@/store/app-store";
import { FEED_ITEMS, TICKER_NOMINAL_ENTRIES } from "@/data/dashboard-static";
import { cn } from "@/lib/utils";

let audioCtx: AudioContext | null = null;

function playAlarmSound() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = 880;
  osc.type = "square";
  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.25);
}

export function AlarmTicker() {
  const { state: settings } = useSettings();
  const intervalRef = useRef<number | null>(null);
  const hasAlarmsRef = useRef<boolean>(false);

  const unackedAlarms = useMemo(
    () =>
      FEED_ITEMS.filter(
        (f) =>
          f.state === "unacked" &&
          (f.severity === "critical" || f.severity === "warning"),
      ),
    [],
  );
  const hasAlarms = unackedAlarms.length > 0;

  useEffect(() => {
    hasAlarmsRef.current = hasAlarms;

    if (settings.soundEnabled && hasAlarms) {
      playAlarmSound();
      if (!intervalRef.current) {
        intervalRef.current = window.setInterval(() => {
          if (hasAlarmsRef.current && settings.soundEnabled) {
            playAlarmSound();
          }
        }, 2000);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hasAlarms, settings.soundEnabled]);

  const renderAlarmEntries = (keyPrefix: string) =>
    unackedAlarms.map((alarm, i) => (
      <React.Fragment key={`${keyPrefix}-${alarm.id}-${i}`}>
        <span
          className={cn(
            "inline-flex items-center gap-1.5",
            alarm.severity === "critical"
              ? "text-(--theme-critical)"
              : "text-(--theme-warning)",
          )}
        >
          <span className={cn(
            "font-['Share_Tech_Mono',monospace] text-fs-10 tracking-[0.04em]",
            alarm.severity === "critical" ? "crit" : "warn"
          )}>
            {alarm.severity === "critical" ? "CRITICAL" : "WARNING"}:{" "}
            {alarm.message}
          </span>
        </span>
        <span className="text-(--theme-fg-dim) shrink-0">·</span>
      </React.Fragment>
    ));

  const renderNominalEntries = (keyPrefix: string) =>
    TICKER_NOMINAL_ENTRIES.map((entry, i) => (
      <React.Fragment key={`${keyPrefix}-${entry.label}-${i}`}>
        <span className="inline-flex items-center gap-1.5">
          <span className="font-['Share_Tech_Mono',monospace] text-fs-10 text-(--theme-fg-dim) uppercase tracking-[0.08em]">
            {entry.label}:
          </span>
          <span className="font-['Share_Tech_Mono',monospace] text-fs-10 text-(--theme-fg-muted) tracking-[0.04em]">
            {entry.value}
          </span>
        </span>
        <span className="text-(--theme-fg-dim) shrink-0">·</span>
      </React.Fragment>
    ));

  return (
    <div
      className={cn(
        "flex items-center h-[26px] w-full",
        "bg-(--theme-surface) border-t border-b border-(--theme-border)",
        "font-['Share_Tech_Mono',monospace] text-fs-10 tracking-[0.06em]",
        "overflow-hidden",
        hasAlarms ? "ticker crit" : "ticker ok",
      )}
    >
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <div
          className={cn(
            "animate-ticker inline-flex gap-8 whitespace-nowrap",
            "hover:[animation-play-state:paused]",
            hasAlarms ? "[animation-duration:32s]" : "[animation-duration:60s]",
          )}
        >
          {hasAlarms ? (
            <>
              {renderAlarmEntries("a")}
              {renderAlarmEntries("b")}
              {renderAlarmEntries("c")}
              {renderAlarmEntries("d")}
            </>
          ) : (
            <>
              {renderNominalEntries("a")}
              {renderNominalEntries("b")}
              {renderNominalEntries("c")}
              {renderNominalEntries("d")}
            </>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex-shrink-0 h-full flex items-center px-3",
          "text-[10px] uppercase tracking-[0.18em] border-l border-(--theme-border)",
          hasAlarms
            ? "bg-[color-mix(in_srgb,var(--theme-critical)_18%,var(--theme-surface))] text-(--theme-critical) border-[color-mix(in_srgb,var(--theme-critical)_60%,transparent)]"
            : "bg-[color-mix(in_srgb,var(--theme-ok)_14%,var(--theme-surface))] text-(--theme-ok) border-[color-mix(in_srgb,var(--theme-ok)_50%,transparent)]",
        )}
      >
        {hasAlarms ? `Critical · ${unackedAlarms.length}` : "All Clear"}
      </div>
    </div>
  );
}
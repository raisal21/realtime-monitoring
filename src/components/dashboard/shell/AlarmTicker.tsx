import React, { useMemo } from "react";
import { TriangleAlert } from "lucide-react";
import { useUi } from "../../../stores/dashboard-store";
import { FEED_ITEMS, TICKER_NOMINAL_ENTRIES } from "../../../data/dashboard-static";
import { cn } from "../../../components";

export function AlarmTicker() {
  const { dispatch } = useUi();

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

  const renderAlarmEntries = (keyPrefix: string) =>
    unackedAlarms.map((alarm, i) => (
      <React.Fragment key={`${keyPrefix}-${alarm.id}-${i}`}>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: "TOGGLE_ALARM_SIDEBAR" });
          }}
          className={cn(
            "inline-flex items-center gap-1.5 cursor-pointer outline-none",
            "hover:brightness-125 transition-[filter] duration-150",
            alarm.severity === "critical"
              ? "text-(--theme-critical)"
              : "text-(--theme-warning)",
          )}
        >
          <TriangleAlert size={11} strokeWidth={2.25} className="shrink-0" />
          <span className="font-['Share_Tech_Mono',monospace] text-[10px] tracking-[0.04em]">
            {alarm.severity === "critical" ? "CRITICAL" : "WARNING"}:{" "}
            {alarm.message}
          </span>
        </button>
        <span className="text-(--theme-fg-dim) shrink-0">·</span>
      </React.Fragment>
    ));

  const renderNominalEntries = (keyPrefix: string) =>
    TICKER_NOMINAL_ENTRIES.map((entry, i) => (
      <React.Fragment key={`${keyPrefix}-${entry.label}-${i}`}>
        <span className="inline-flex items-center gap-1.5">
          <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-(--theme-fg-dim) uppercase tracking-[0.08em]">
            {entry.label}:
          </span>
          <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-(--theme-fg-muted) tracking-[0.04em]">
            {entry.value}
          </span>
        </span>
        <span className="text-(--theme-fg-dim) shrink-0">·</span>
      </React.Fragment>
    ));

  return (
    <div
      className={cn(
        "ticker-strip flex-1 relative overflow-hidden",
        "[&:hover_.animate-ticker]:[animation-play-state:paused]",
      )}
    >
      <div
        className={cn(
          "animate-ticker inline-flex gap-8 whitespace-nowrap",
          !hasAlarms && "[animation-duration:60s]",
        )}
      >
        {hasAlarms ? (
          <>
            {renderAlarmEntries("a")}
            {renderAlarmEntries("b")}
          </>
        ) : (
          <>
            {renderNominalEntries("a")}
            {renderNominalEntries("b")}
          </>
        )}
      </div>
    </div>
  );
}
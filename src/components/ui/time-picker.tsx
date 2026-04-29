"use client";

import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

interface TimePickerProps {
  value: number; // minutes since midnight
  onChange: (minutes: number) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const h = Math.floor(value / 60) % 24;
  const m = value % 60;

  const updateHour = (newH: number) => {
    const wrapped = ((newH % 24) + 24) % 24;
    onChange(wrapped * 60 + m);
  };

  const updateMinute = (newM: number) => {
    const wrapped = ((newM % 60) + 60) % 60;
    onChange(h * 60 + wrapped);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-(--radius-badge) overflow-hidden",
        "bg-(--theme-elevated) border border-(--theme-border)",
        "focus-within:border-(--theme-accent) transition-colors",
        className,
      )}
    >
      {/* Hour */}
      <div className="flex items-center">
        <input
          type="text"
          inputMode="numeric"
          value={pad(h)}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!Number.isNaN(v)) updateHour(v);
          }}
          className={cn(
            "w-[32px] bg-transparent border-none outline-none text-center",
            "font-['Share_Tech_Mono',monospace] tabular-nums",
            "text-[13px] font-semibold text-(--theme-fg)",
            "py-1",
          )}
          aria-label="Hour"
        />
        <div className="flex flex-col pr-0.5 -mr-0.5">
          <button
            type="button"
            onClick={() => updateHour(h + 1)}
            className="flex items-center justify-center cursor-pointer text-(--theme-fg-dim) hover:text-(--theme-fg) transition-colors leading-none"
            aria-label="Increment hour"
          >
            <ChevronUp size={9} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => updateHour(h - 1)}
            className="flex items-center justify-center cursor-pointer text-(--theme-fg-dim) hover:text-(--theme-fg) transition-colors leading-none"
            aria-label="Decrement hour"
          >
            <ChevronDown size={9} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <span className="text-(--theme-fg-dim) text-[13px] font-semibold select-none px-0.5">
        :
      </span>

      {/* Minute */}
      <div className="flex items-center">
        <input
          type="text"
          inputMode="numeric"
          value={pad(m)}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!Number.isNaN(v)) updateMinute(v);
          }}
          className={cn(
            "w-[32px] bg-transparent border-none outline-none text-center",
            "font-['Share_Tech_Mono',monospace] tabular-nums",
            "text-[13px] font-semibold text-(--theme-fg)",
            "py-1",
          )}
          aria-label="Minute"
        />
        <div className="flex flex-col pr-0.5 -mr-0.5">
          <button
            type="button"
            onClick={() => updateMinute(m + 1)}
            className="flex items-center justify-center cursor-pointer text-(--theme-fg-dim) hover:text-(--theme-fg) transition-colors leading-none"
            aria-label="Increment minute"
          >
            <ChevronUp size={9} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => updateMinute(m - 1)}
            className="flex items-center justify-center cursor-pointer text-(--theme-fg-dim) hover:text-(--theme-fg) transition-colors leading-none"
            aria-label="Decrement minute"
          >
            <ChevronDown size={9} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

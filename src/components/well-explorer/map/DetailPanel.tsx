import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Surface, StatusDot, Button } from "@/components/core";
import { ValueReadout } from "@/components/telemetry";
import type { Well } from "@/data/wells";
import { WELL_TYPE_COLOR, WELL_TYPE_LABEL, STATUS_LABEL, STATUS_DOT } from "../lib/constants";

interface DetailPanelProps {
  well: Well;
  onClose: () => void;
}

export function DetailPanel({ well, onClose }: DetailPanelProps) {
  const navigate = useNavigate();
  const isActive = well.status === "drilling";
  const barColor = WELL_TYPE_COLOR[well.wellType];

  return (
    <div
      className={cn(
        "absolute top-[12px] left-[12px] z-40 w-[280px]",
        "overflow-hidden animate-fade-up",
        "shadow-[0_8px_40px_rgba(0,0,0,0.7)]",
      )}
    >
      <Surface elevation="glass" outline="all">
        <div className="h-[3px] w-full" style={{ background: barColor }} />

        <div className="flex items-center gap-[8px] px-[10px] py-[8px] border-b border-(--theme-border)">
          <StatusDot
            status={STATUS_DOT[well.status]}
            size="md"
            glow={isActive}
            pulse={isActive}
            className="flex-shrink-0"
          />
          <span
            className={cn(
              "flex-1 font-['Barlow_Condensed',sans-serif]",
              "text-fs-15 leading-none font-bold tracking-[0.03em] text-(--theme-fg)",
            )}
          >
            {well.name}
            <span className="text-(--theme-fg-dim) font-normal ml-[6px] text-fs-11 leading-none inline-block">
              · {WELL_TYPE_LABEL[well.wellType]}
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "w-[20px] h-[20px] flex items-center justify-center rounded-[2px]",
              "text-fs-13 leading-none inline-block text-(--theme-fg-dim)",
              "hover:bg-(--theme-overlay) hover:text-(--theme-fg)",
              "transition-colors duration-120",
            )}
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-[8px] px-[10px] py-[6px] border-b border-(--theme-border)">
          <div className="flex flex-col gap-[1px]">
            <ValueReadout
              value={well.temperature}
              size="md"
              status={isActive ? "ok" : "inactive"}
            />
            <span className="label-mono">Temp</span>
          </div>
          <div className="flex flex-col gap-[1px]">
            <ValueReadout
              value={well.flowRate}
              size="md"
              status={isActive ? "info" : "inactive"}
            />
            <span className="label-mono">Flow</span>
          </div>
          <div className="flex flex-col gap-[1px]">
            <ValueReadout
              value={well.pressure}
              size="md"
              status={isActive ? "ok" : "inactive"}
            />
            <span className="label-mono">Pressure</span>
          </div>
        </div>

        <div className="px-[10px] py-[8px]">
          {isActive ? (
            <Button intent="primary" size="lg" fullWidth onClick={() => navigate(`/dashboard/${well.id}`)}>
              Enter Control Room →
            </Button>
          ) : (
            <Button intent="secondary" size="lg" fullWidth disabled>
              {STATUS_LABEL[well.status]} — Not Available
            </Button>
          )}
        </div>
      </Surface>
    </div>
  );
}

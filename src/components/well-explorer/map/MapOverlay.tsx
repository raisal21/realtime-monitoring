import { Surface } from "@/components/core";
import type { Well } from "@/data/wells";
import { WELL_TYPE_COLOR, WELL_TYPE_LABEL } from "../lib/constants";

interface MapOverlayProps {
  coords: string;
}

export function MapOverlay({ coords }: MapOverlayProps) {
  return (
    <div className="absolute bottom-[20px] left-[20px] z-40 flex flex-col gap-[8px]">
      <Surface
        elevation="glass"
        outline="all"
        className="px-[10px] py-[6px] animate-fade-up"
      >
        <span className="section-heading block leading-none mb-[6px]">Well Types</span>
        {(Object.keys(WELL_TYPE_COLOR) as Well["wellType"][]).map((t) => (
          <div key={t} className="flex items-center gap-[7px] mb-[3px] last:mb-0">
            <div
              className="w-[8px] h-[8px] rounded-full"
              style={{ background: WELL_TYPE_COLOR[t] }}
            />
            <span className="font-['Barlow_Condensed',sans-serif] text-fs-10 leading-none inline-block text-(--theme-fg-muted)">
              {WELL_TYPE_LABEL[t]}
            </span>
          </div>
        ))}
      </Surface>

      <Surface
        elevation="glass"
        outline="all"
        className="px-[8px] py-[4px] animate-fade-up [animation-delay:100ms]"
      >
        <span className="font-['Share_Tech_Mono',monospace] text-fs-10 leading-none inline-block text-(--theme-fg-dim)">
          {coords}
        </span>
      </Surface>
    </div>
  );
}

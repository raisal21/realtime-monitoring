import { Monitor } from "lucide-react";

export default function ScreenGuard() {
  return (
    <div className="screen-guard">
      <Monitor
        size={34}
        strokeWidth={1.5}
        className="text-(--theme-fg-dim) opacity-40"
      />
      <span className="section-heading text-fs-16">
        Large Display Required
      </span>
      <span className="font-['Barlow',sans-serif] text-fs-12 text-(--theme-fg-muted) max-w-[300px] text-center leading-relaxed">
        This enterprise control room is engineered for large displays. Please
        open on a desktop or laptop.
      </span>
      <span className="font-['Share_Tech_Mono',monospace] text-fs-11 text-(--theme-accent) px-[12px] py-[3px] border border-(--theme-accent) opacity-60 rounded-(--radius-badge)">
        Min. 1024 × 768 px
      </span>
    </div>
  );
}

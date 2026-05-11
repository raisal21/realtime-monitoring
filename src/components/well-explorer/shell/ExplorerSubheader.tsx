import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/core";
import type { Well } from "@/data/wells";

interface ExplorerSubheaderProps {
  query: string;
  onQueryChange: (v: string) => void;
  activeType: Well["wellType"] | "all";
  onTypeChange: (f: Well["wellType"] | "all") => void;
  total: number;
  filtered: number;
}

export function ExplorerSubheader({
  query,
  onQueryChange,
  activeType,
  onTypeChange,
  total,
  filtered,
}: ExplorerSubheaderProps) {
  const types: { key: Well["wellType"] | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "production", label: "Production" },
    { key: "injection", label: "Injection" },
    { key: "delineation", label: "Delineation" },
  ];

  return (
    <div
      className={cn(
        "flex items-center px-4 gap-3 flex-shrink-0",
        "bg-(--theme-surface) border-b border-(--theme-border)",
      )}
      style={{ height: "var(--spacing-rt-shell-sub)" }}
    >
      <span className="font-['Barlow_Condensed',sans-serif] text-fs-13 font-bold tracking-[0.04em] text-(--theme-fg) flex items-center gap-2">
        <span className="text-(--theme-orange)">▴</span>
        Guntur Geothermal Field
      </span>

      <div className="w-px h-5 bg-(--theme-border)" />

      <div className="flex items-center gap-1">
        {types.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onTypeChange(t.key)}
            className={cn(
              "px-2.5 py-1 rounded-(--radius-badge)",
              "font-['Barlow_Condensed',sans-serif] text-fs-11 font-semibold tracking-wider",
              "transition-colors duration-150",
              activeType === t.key
                ? "bg-(--theme-accent-dim) text-(--theme-accent)"
                : "text-(--theme-fg-dim) hover:text-(--theme-fg-muted)",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <div className="w-[200px]">
        <Input
          placeholder="Search well…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          icon={
            <span className="text-(--theme-fg-dim)" style={{ fontSize: 13 }}>
              ⌕
            </span>
          }
          wrapperClassName="h-[26px]"
          className="py-0 pr-2 text-fs-11"
        />
      </div>

      <span className="label-mono text-(--theme-fg-dim)">
        {filtered}/{total} wells
      </span>
    </div>
  );
}

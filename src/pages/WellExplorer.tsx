"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  Button,
  Badge,
  StatusDot,
  Surface,
  ValueReadout,
  SidebarStat,
  WellListItem,
  WellMetric,
  BreadcrumbItem,
  ConnectionStatus,
  Input,
  cn,
} from "../components/components";

/* ─────────────────────────────────────────────────────────────
   MapLibre GL JS tidak memerlukan access token.
   Style map menggunakan CARTO Dark Matter (gratis, tanpa API key).
   Anda bisa mengganti dengan style MapTiler/Stadia jika perlu:
     MapTiler  → "https://api.maptiler.com/maps/backdrop-dark/style.json?key=YOUR_KEY"
     Stadia    → "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json"
───────────────────────────────────────────────────────────── */
const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/* ═══════════════════════════════════════════════════════════
   WELL DATA
═══════════════════════════════════════════════════════════ */
export type WellStatus = "drilling" | "standby" | "offline";

export interface Well {
  id: string;
  name: string;
  block: string;
  status: WellStatus;
  lat: number;
  lon: number;
  depth: string;
  rop: string;
  rpm: string;
  operator: string;
  spud: string;
  target: string;
}

const WELLS: Well[] = [
  {
    id: "alpha-1",
    name: "Alpha-1",
    block: "Block 7G · Makassar Strait",
    status: "drilling",
    lat: -1.28,
    lon: 117.45,
    depth: "12,563 ft",
    rop: "24.8 ft/hr",
    rpm: "120 rpm",
    operator: "Ahmad R.",
    spud: "Mar 12, 2025",
    target: "15,200 ft",
  },
  {
    id: "bravo-3",
    name: "Bravo-3",
    block: "Block 12A · Java Sea",
    status: "drilling",
    lat: -5.82,
    lon: 112.6,
    depth: "9,881 ft",
    rop: "31.2 ft/hr",
    rpm: "105 rpm",
    operator: "Dwi S.",
    spud: "Jan 28, 2025",
    target: "12,000 ft",
  },
  {
    id: "charlie-2",
    name: "Charlie-2",
    block: "Block 3F · Natuna Sea",
    status: "drilling",
    lat: 3.9,
    lon: 108.22,
    depth: "7,240 ft",
    rop: "18.5 ft/hr",
    rpm: "90 rpm",
    operator: "Budi H.",
    spud: "Apr 2, 2025",
    target: "10,500 ft",
  },
  {
    id: "delta-5",
    name: "Delta-5",
    block: "Block 9B · Barito Basin",
    status: "standby",
    lat: -1.9,
    lon: 114.8,
    depth: "—",
    rop: "—",
    rpm: "—",
    operator: "—",
    spud: "TBD",
    target: "11,800 ft",
  },
  {
    id: "echo-1",
    name: "Echo-1",
    block: "Block 2C · Kutei Basin",
    status: "standby",
    lat: 0.5,
    lon: 116.9,
    depth: "—",
    rop: "—",
    rpm: "—",
    operator: "—",
    spud: "TBD",
    target: "13,000 ft",
  },
  {
    id: "foxtrot-4",
    name: "Foxtrot-4",
    block: "Block 6D · Sumatra Shelf",
    status: "offline",
    lat: 1.2,
    lon: 102.8,
    depth: "14,200 ft",
    rop: "—",
    rpm: "—",
    operator: "—",
    spud: "Nov 5, 2024",
    target: "14,200 ft",
  },
  {
    id: "gulf-7",
    name: "Gulf-7",
    block: "Block 11E · Banda Sea",
    status: "offline",
    lat: -5.5,
    lon: 128.4,
    depth: "8,900 ft",
    rop: "—",
    rpm: "—",
    operator: "—",
    spud: "Sep 18, 2024",
    target: "8,900 ft",
  },
  {
    id: "hotel-2",
    name: "Hotel-2",
    block: "Block 4A · Mahakam Delta",
    status: "offline",
    lat: -0.5,
    lon: 117.0,
    depth: "11,400 ft",
    rop: "—",
    rpm: "—",
    operator: "—",
    spud: "Dec 2, 2024",
    target: "11,400 ft",
  },
  {
    id: "india-3",
    name: "India-3",
    block: "Block 8H · Timor Sea",
    status: "offline",
    lat: -9.8,
    lon: 126.1,
    depth: "6,200 ft",
    rop: "—",
    rpm: "—",
    operator: "—",
    spud: "Oct 30, 2024",
    target: "6,200 ft",
  },
];

/* ─── Status helpers ─── */
const STATUS_COLOR: Record<WellStatus, string> = {
  drilling: "var(--theme-ok)",
  standby: "var(--theme-warning)",
  offline: "var(--theme-fg-dim)",
};

const STATUS_HEX: Record<WellStatus, string> = {
  drilling: "#b8bb26",
  standby: "#fabd2f",
  offline: "#5a524a",
};

const STATUS_LABEL: Record<WellStatus, string> = {
  drilling: "Drilling",
  standby: "Standby",
  offline: "Offline",
};

const STATUS_DOT: Record<
  WellStatus,
  React.ComponentProps<typeof StatusDot>["status"]
> = {
  drilling: "ok",
  standby: "warning",
  offline: "inactive",
};

/* ═══════════════════════════════════════════════════════════
   MAPLIBRE — custom SVG marker element builder
   Returns a raw HTMLElement that MapLibre attaches to the map.
═══════════════════════════════════════════════════════════ */
function buildMarkerEl(well: Well): HTMLDivElement {
  const col = STATUS_HEX[well.status];
  const isDrill = well.status === "drilling";
  const opacity = well.status === "offline" ? "0.5" : "1";

  const wrap = document.createElement("div");
  wrap.style.cssText = "width:28px;height:28px;cursor:pointer;";

  wrap.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" overflow="visible">
      ${
        isDrill
          ? `
        <circle cx="14" cy="14" r="10" fill="${col}" opacity="0">
          <animate attributeName="r"       values="9;17;9"      dur="2.4s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.14;0;0.14" dur="2.4s" repeatCount="indefinite"/>
        </circle>`
          : ""
      }
      <circle cx="14" cy="14" r="7"   fill="${col}" opacity="${opacity}"/>
      <circle cx="14" cy="14" r="4"   fill="#0f1214" opacity="0.75"/>
      <circle cx="14" cy="14" r="2.4" fill="${col}" opacity="${isDrill ? "0.9" : "0.4"}"/>
    </svg>`;

  return wrap;
}

/* ═══════════════════════════════════════════════════════════
   MAPLIBRE POPUP — React-rendered content injected as HTML string
═══════════════════════════════════════════════════════════ */
function buildPopupHTML(well: Well): string {
  const isDrill = well.status === "drilling";
  const col = STATUS_HEX[well.status];
  const depthCol = isDrill ? "#d3869b" : "#5a524a";
  const ropCol = isDrill ? "#83a598" : "#5a524a";

  return /* html */ `
    <div style="
      width:240px;
      font-family:'Barlow Condensed',sans-serif;
      color:#ebdbb2;
    ">
      <!-- Head -->
      <div style="
        padding:12px 14px 10px;
        border-bottom:1px solid #3c3836;
        display:flex;align-items:flex-start;gap:8px;
      ">
        <div style="
          width:8px;height:8px;border-radius:50%;
          background:${col};margin-top:5px;flex-shrink:0;
          ${isDrill ? `box-shadow:0 0 7px ${col};` : ""}
        "></div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;letter-spacing:.04em;">${well.name}</div>
          <div style="font-size:10px;color:#a89984;margin-top:1px;">${well.block}</div>
        </div>
        <div style="
          font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
          padding:2px 7px;border-radius:2px;flex-shrink:0;
          ${
            isDrill
              ? "background:rgba(184,187,38,.15);color:#b8bb26;border:1px solid rgba(184,187,38,.3);"
              : well.status === "standby"
                ? "background:rgba(250,189,47,.12);color:#fabd2f;border:1px solid rgba(250,189,47,.25);"
                : "background:#32302f;color:#5a524a;border:1px solid #3c3836;"
          }
        ">${STATUS_LABEL[well.status]}</div>
      </div>

      <!-- Body: KPIs -->
      <div style="
        padding:10px 14px;
        border-bottom:1px solid #3c3836;
        display:grid;grid-template-columns:1fr 1fr;gap:8px;
      ">
        <div>
          <div style="font-family:'Share Tech Mono',monospace;font-size:13px;color:${depthCol};">${well.depth}</div>
          <div style="font-size:8px;color:#5a524a;text-transform:uppercase;letter-spacing:.08em;">Curr. Depth</div>
        </div>
        <div>
          <div style="font-family:'Share Tech Mono',monospace;font-size:13px;color:${ropCol};">${well.rop}</div>
          <div style="font-size:8px;color:#5a524a;text-transform:uppercase;letter-spacing:.08em;">ROP</div>
        </div>
        <div>
          <div style="font-family:'Share Tech Mono',monospace;font-size:13px;color:#ebdbb2;">${well.target}</div>
          <div style="font-size:8px;color:#5a524a;text-transform:uppercase;letter-spacing:.08em;">TD Target</div>
        </div>
        <div>
          <div style="font-family:'Share Tech Mono',monospace;font-size:13px;color:#a89984;">${well.spud}</div>
          <div style="font-size:8px;color:#5a524a;text-transform:uppercase;letter-spacing:.08em;">Spud Date</div>
        </div>
      </div>

      <!-- Footer: CTA -->
      <div style="padding:10px 14px;">
        <button
          onclick="window.__rtdc_enter('${well.id}')"
          ${!isDrill ? "disabled" : ""}
          style="
            width:100%;padding:8px;border:none;border-radius:3px;cursor:${isDrill ? "pointer" : "not-allowed"};
            font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;
            text-transform:uppercase;letter-spacing:.12em;
            background:${isDrill ? "#83a598" : "#32302f"};
            color:${isDrill ? "#0c0e10" : "#5a524a"};
            display:flex;align-items:center;justify-content:center;gap:6px;
            transition:all .15s;
          "
        >${isDrill ? "Enter Dashboard →" : "Unavailable"}</button>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   DETAIL PANEL — floats over the map (top-left)
═══════════════════════════════════════════════════════════ */
function DetailPanel({
  well,
  onClose,
  onEnter,
}: {
  well: Well;
  onClose: () => void;
  onEnter: (id: string) => void;
}) {
  const isDrill = well.status === "drilling";
  const barColor = STATUS_COLOR[well.status];

  return (
    <div
      className={cn(
        "absolute top-[12px] left-[12px] z-40 w-[280px]",
        "overflow-hidden animate-fade-up",
        "shadow-[0_8px_40px_rgba(0,0,0,0.7)]",
      )}
    >
      <Surface elevation="glass" outline="all">
        {/* Status bar accent — 3px top line */}
        <div className="h-[3px] w-full" style={{ background: barColor }} />

        {/* Head */}
        <div className="flex items-center gap-[8px] px-[14px] py-[12px] border-b border-(--theme-border)">
          <StatusDot
            status={STATUS_DOT[well.status]}
            size="md"
            glow={isDrill}
            pulse={isDrill}
            className="flex-shrink-0"
          />
          <span
            className={cn(
              "flex-1 font-['Barlow_Condensed',sans-serif]",
              "text-[15px] font-bold tracking-[0.03em] text-(--theme-fg)",
            )}
          >
            {well.name}
            <span className="text-(--theme-fg-dim) font-normal ml-[6px] text-[11px]">
              · {STATUS_LABEL[well.status]}
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "w-[20px] h-[20px] flex items-center justify-center rounded-[2px]",
              "text-[13px] text-(--theme-fg-dim)",
              "hover:bg-(--theme-overlay) hover:text-(--theme-fg)",
              "transition-colors duration-120",
            )}
          >
            ✕
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-[8px] px-[14px] py-[10px] border-b border-(--theme-border)">
          <div className="flex flex-col gap-[1px]">
            <ValueReadout
              value={well.depth}
              size="md"
              status={isDrill ? "info" : "inactive"}
            />
            <span className="label-mono">Depth</span>
          </div>
          <div className="flex flex-col gap-[1px]">
            <ValueReadout
              value={well.rop}
              size="md"
              status={isDrill ? "ok" : "inactive"}
            />
            <span className="label-mono">ROP</span>
          </div>
          <div className="flex flex-col gap-[1px]">
            <ValueReadout
              value={well.rpm}
              size="md"
              status={isDrill ? "ok" : "inactive"}
            />
            <span className="label-mono">RPM</span>
          </div>
        </div>

        {/* CTA */}
        <div className="px-[14px] py-[10px]">
          {isDrill ? (
            <Button
              intent="primary"
              size="lg"
              fullWidth
              onClick={() => onEnter(well.id)}
            >
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

/* ═══════════════════════════════════════════════════════════
   MAP LEGEND + COORD DISPLAY — bottom-left overlay
═══════════════════════════════════════════════════════════ */
function MapOverlay({ coords }: { coords: string }) {
  return (
    <div className="absolute bottom-[20px] left-[20px] z-40 flex flex-col gap-[8px]">
      {/* Legend */}
      <Surface
        elevation="glass"
        outline="all"
        className="px-[14px] py-[10px] animate-fade-up"
      >
        <span className="section-heading block mb-[7px]">Well Status</span>
        {(["drilling", "standby", "offline"] as WellStatus[]).map((s) => (
          <div
            key={s}
            className="flex items-center gap-[7px] mb-[4px] last:mb-0"
          >
            <StatusDot
              status={STATUS_DOT[s]}
              size="sm"
              glow={s === "drilling"}
              pulse={s === "drilling"}
            />
            <span className="font-['Barlow_Condensed',sans-serif] text-[10px] text-(--theme-fg-muted)">
              {s === "drilling"
                ? "Active — Drilling"
                : s === "standby"
                  ? "Standby / Ready"
                  : "Offline / P&A"}
            </span>
          </div>
        ))}
      </Surface>

      {/* Coord display */}
      <Surface
        elevation="glass"
        outline="all"
        className="px-[10px] py-[5px] animate-fade-up [animation-delay:100ms]"
      >
        <span className="font-['Share_Tech_Mono',monospace] text-[10px] text-(--theme-fg-dim)">
          {coords}
        </span>
      </Surface>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR — right panel: stats + search + well list
═══════════════════════════════════════════════════════════ */
function Sidebar({
  wells,
  selectedId,
  onSelectWell,
  onEnter,
}: {
  wells: Well[];
  selectedId: string | null;
  onSelectWell: (well: Well) => void;
  onEnter: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q
      ? wells.filter(
          (w) =>
            w.name.toLowerCase().includes(q) ||
            w.block.toLowerCase().includes(q),
        )
      : wells;
  }, [wells, query]);

  const counts = useMemo(
    () => ({
      drilling: wells.filter((w) => w.status === "drilling").length,
      standby: wells.filter((w) => w.status === "standby").length,
      offline: wells.filter((w) => w.status === "offline").length,
    }),
    [wells],
  );

  return (
    <aside
      className={cn(
        "flex flex-col overflow-hidden flex-shrink-0 z-10",
        "bg-(--theme-surface) border-l border-(--theme-border)",
        "animate-[slide-in-right_.4s_cubic-bezier(.22,1,.36,1)_both]",
      )}
      style={{ width: 320 }}
    >
      {/* Head: fleet stats */}
      <div className="px-[16px] py-[14px] border-b border-(--theme-border) flex-shrink-0">
        <span className="section-heading block mb-[10px]">Fleet Overview</span>
        <div className="grid grid-cols-3 gap-[8px]">
          <SidebarStat
            value={counts.drilling}
            label="Drilling"
            colorScheme="ok"
          />
          <SidebarStat
            value={counts.standby}
            label="Standby"
            colorScheme="warning"
          />
          <SidebarStat
            value={counts.offline}
            label="Offline"
            colorScheme="inactive"
          />
        </div>
      </div>

      {/* Search */}
      <div className="px-[12px] py-[10px] border-b border-(--theme-border) flex-shrink-0">
        <Input
          placeholder="Search well name or block…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={
            <span className="text-(--theme-fg-dim)" style={{ fontSize: 13 }}>
              ⌕
            </span>
          }
        />
      </div>

      {/* Well list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.map((w) => (
          <WellListItem
            key={w.id}
            name={w.name}
            block={w.block}
            drillingStatus={w.status}
            selected={selectedId === w.id}
            onClick={() => onSelectWell(w)}
            onEnter={w.status === "drilling" ? () => onEnter(w.id) : undefined}
            metrics={
              w.status === "drilling"
                ? [
                    { key: "Depth", value: w.depth },
                    { key: "ROP", value: w.rop },
                    { key: "RPM", value: w.rpm },
                  ]
                : [{ key: "TD Target", value: w.target }]
            }
          />
        ))}
        {filtered.length === 0 && (
          <div className="px-[16px] py-[24px] text-center">
            <span className="font-['Share_Tech_Mono',monospace] text-[11px] text-(--theme-fg-dim)">
              No wells match "{query}"
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════
   TOPBAR
═══════════════════════════════════════════════════════════ */
function Topbar({ wells }: { wells: Well[] }) {
  const counts = useMemo(
    () => ({
      drilling: wells.filter((w) => w.status === "drilling").length,
      standby: wells.filter((w) => w.status === "standby").length,
      offline: wells.filter((w) => w.status === "offline").length,
    }),
    [wells],
  );

  return (
    <header
      className={cn(
        "flex items-center px-[16px] gap-0 z-50 flex-shrink-0",
        "bg-(--theme-surface) border-b border-(--theme-border)",
      )}
      style={{ height: 44 }}
    >
      {/* Brand */}
      <div className="flex items-center gap-[8px] pr-[16px] border-r border-(--theme-border) mr-[16px] flex-shrink-0">
        <div
          className={cn(
            "w-[24px] h-[24px] rounded-[3px] flex items-center justify-center flex-shrink-0",
            "border border-(--theme-accent)",
            "font-['Share_Tech_Mono',monospace] text-[11px] text-(--theme-accent)",
          )}
        >
          R
        </div>
        <span className="brand-title text-[13px]">RTDC</span>
        <div className="w-px h-[14px] bg-(--theme-border)" />
        <span className="label-mono">Control Room</span>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-[6px]">
        <BreadcrumbItem type="link">Home</BreadcrumbItem>
        <BreadcrumbItem type="separator">›</BreadcrumbItem>
        <BreadcrumbItem type="current">Well Explorer</BreadcrumbItem>
      </div>

      <div className="flex-1" />

      {/* Fleet meta */}
      <div className="flex items-center gap-[16px] mr-[16px]">
        {[
          { label: "Active", value: counts.drilling, status: "ok" as const },
          {
            label: "Standby",
            value: counts.standby,
            status: "warning" as const,
          },
          {
            label: "Offline",
            value: counts.offline,
            status: "inactive" as const,
          },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-[5px]">
            <span className="label-mono">{m.label}</span>
            <ValueReadout value={m.value} size="sm" status={m.status} />
          </div>
        ))}
      </div>

      {/* User chip */}
      <div
        className={cn(
          "flex items-center gap-[8px] px-[10px] py-[4px]",
          "border border-(--theme-border) rounded-(--radius-panel)",
          "hover:border-(--theme-accent) hover:bg-(--theme-elevated)",
          "transition-all duration-150 cursor-pointer",
        )}
      >
        <div
          className={cn(
            "w-[20px] h-[20px] rounded-full",
            "bg-(--theme-elevated) border border-(--theme-accent)",
            "flex items-center justify-center",
            "font-['Share_Tech_Mono',monospace] text-[10px] text-(--theme-accent)",
          )}
        >
          A
        </div>
        <div className="flex flex-col">
          <span className="font-['Barlow_Condensed',sans-serif] text-[11px] font-semibold text-(--theme-fg)">
            Ahmad R.
          </span>
          <span className="label-mono">Driller</span>
        </div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAPLIBRE HOOK
   Handles: init, markers, popups, flyTo, coord tracking.
═══════════════════════════════════════════════════════════ */
function useMaplibre({
  containerRef,
  wells,
  onSelectWell,
  onEnterDashboard,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  wells: Well[];
  onSelectWell: (well: Well) => void;
  onEnterDashboard: (id: string) => void;
}) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});
  const popupsRef = useRef<Record<string, maplibregl.Popup>>({});
  const [coords, setCoords] = useState("LAT — · LON —");

  // Expose enter callback to popup HTML buttons
  useEffect(() => {
    (window as Record<string, unknown>)["__rtdc_enter"] = (id: string) => {
      onEnterDashboard(id);
    };
    return () => {
      delete (window as Record<string, unknown>)["__rtdc_enter"];
    };
  }, [onEnterDashboard]);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [115.0, -2.5],
      zoom: 4.8,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    // Coord tracker
    map.on("mousemove", (e) => {
      setCoords(
        `LAT ${e.lngLat.lat.toFixed(4)} · LON ${e.lngLat.lng.toFixed(4)}`,
      );
    });
    map.on("mouseleave", () => setCoords("LAT — · LON —"));

    mapRef.current = map;

    // Add markers after style loads
    map.on("load", () => {
      wells.forEach((w) => {
        const el = buildMarkerEl(w);

        const popup = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: false,
          offset: 18,
          className: "rtdc-popup",
          maxWidth: "260px",
        }).setHTML(buildPopupHTML(w));

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([w.lon, w.lat])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener("click", () => {
          onSelectWell(w);
        });

        markersRef.current[w.id] = marker;
        popupsRef.current[w.id] = popup;
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // flyTo + open popup when a well is selected
  const flyToWell = useCallback(
    (id: string) => {
      const map = mapRef.current;
      if (!map) return;
      const well = wells.find((w) => w.id === id);
      if (!well) return;

      map.flyTo({
        center: [well.lon, well.lat],
        zoom: 7,
        duration: 1400,
        easing: (t) => t * (2 - t), // ease-out quad
      });

      setTimeout(() => {
        // Close all popups first
        Object.values(popupsRef.current).forEach((p) => p.remove());
        markersRef.current[id]?.togglePopup();
      }, 1450);
    },
    [wells],
  );

  return { coords, flyToWell };
}

/* ═══════════════════════════════════════════════════════════
   MAPLIBRE POPUP DARK STYLE — injected once into <head>
   NOTE: MapLibre uses "maplibregl-" prefix (bukan "mapboxgl-").
═══════════════════════════════════════════════════════════ */
const POPUP_STYLES = `
  .rtdc-popup .maplibregl-popup-content {
    background: rgba(34,38,42,0.96);
    backdrop-filter: blur(12px);
    border: 1px solid #3c3836;
    border-radius: 4px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.7);
    padding: 0;
  }
  .rtdc-popup .maplibregl-popup-tip {
    border-top-color: #3c3836;
    border-bottom-color: #3c3836;
  }
  .rtdc-popup .maplibregl-popup-close-button {
    color: #5a524a;
    font-size: 16px;
    top: 6px;
    right: 8px;
    background: none;
    padding: 2px 4px;
    line-height: 1;
  }
  .rtdc-popup .maplibregl-popup-close-button:hover {
    color: #ebdbb2;
    background: rgba(60,56,54,0.5);
    border-radius: 2px;
  }
  /* MapLibre nav control overrides */
  .maplibregl-ctrl-group {
    background: var(--theme-surface) !important;
    border: 1px solid var(--theme-border) !important;
    border-radius: 3px !important;
    box-shadow: none !important;
    overflow: hidden;
  }
  .maplibregl-ctrl-group button {
    background: var(--theme-surface) !important;
    border-bottom: 1px solid var(--theme-border) !important;
    width: 28px !important;
    height: 28px !important;
  }
  .maplibregl-ctrl-group button:hover {
    background: var(--theme-elevated) !important;
  }
  .maplibregl-ctrl-group button span {
    filter: invert(1) brightness(0.6);
  }
  .maplibregl-ctrl-attrib {
    background: rgba(25,27,30,0.85) !important;
    color: #44535f !important;
    font-size: 8px !important;
    backdrop-filter: blur(4px);
  }
  .maplibregl-ctrl-attrib a { color: #44535f !important; }
  /* slide-in-right keyframe for sidebar */
  @keyframes slide-in-right {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: none; opacity: 1; }
  }
`;

/* ═══════════════════════════════════════════════════════════
   WELL EXPLORER PAGE
═══════════════════════════════════════════════════════════ */
export default function WellExplorer() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedWell, setSelectedWell] = useState<Well | null>(null);

  const handleEnterDashboard = useCallback((id: string) => {
    // In real app: router.push(`/rig/${id}`)
    console.log(`→ Navigating to dashboard for well: ${id}`);
  }, []);

  const handleSelectWell = useCallback((well: Well) => {
    setSelectedWell(well);
  }, []);

  const { coords, flyToWell } = useMaplibre({
    containerRef: mapContainerRef as React.RefObject<HTMLDivElement>,
    wells: WELLS,
    onSelectWell: handleSelectWell,
    onEnterDashboard: handleEnterDashboard,
  });

  // When sidebar item clicked → flyTo + show detail
  const handleSidebarSelect = useCallback(
    (well: Well) => {
      setSelectedWell(well);
      flyToWell(well.id);
    },
    [flyToWell],
  );

  return (
    <>
      {/* Inject popup + control styles once */}
      <style>{POPUP_STYLES}</style>

      {/* Screen guard */}
      <div className="screen-guard">
        <span className="text-[34px] opacity-40">🖥</span>
        <span className="section-heading text-[16px]">
          Large Display Required
        </span>
        <span className="font-['Barlow',sans-serif] text-[12px] text-(--theme-fg-muted) max-w-[300px] text-center leading-relaxed">
          Please open on a desktop or laptop.
        </span>
      </div>

      {/* App shell */}
      <div
        className="grid h-screen w-screen overflow-hidden"
        style={{ gridTemplateRows: "44px 1fr" }}
      >
        {/* Topbar */}
        <Topbar wells={WELLS} />

        {/* Main area: map + overlays + sidebar */}
        <div className="relative flex overflow-hidden">
          {/* ── MapLibre container ── */}
          <div
            ref={mapContainerRef}
            className="flex-1 h-full"
            style={{ background: "#0f1214" }}
          />

          {/* ── Detail panel (top-left over map) ── */}
          {selectedWell && (
            <DetailPanel
              well={selectedWell}
              onClose={() => setSelectedWell(null)}
              onEnter={handleEnterDashboard}
            />
          )}

          {/* ── Legend + coords (bottom-left over map) ── */}
          <MapOverlay coords={coords} />

          {/* ── Sidebar (right) ── */}
          <Sidebar
            wells={WELLS}
            selectedId={selectedWell?.id ?? null}
            onSelectWell={handleSidebarSelect}
            onEnter={handleEnterDashboard}
          />
        </div>
      </div>
    </>
  );
}

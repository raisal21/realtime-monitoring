import { WELLS, type Well } from "@/data/wells";
import { WELL_TYPE_LABEL, STATUS_LABEL } from "./constants";

export function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[1] * Math.PI) / 180) *
      Math.cos((b[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function buildCollisionLines(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (let i = 0; i < WELLS.length; i++) {
    for (let j = i + 1; j < WELLS.length; j++) {
      if (WELLS[i].padId !== WELLS[j].padId) continue;
      const dist = haversineMeters(
        [WELLS[i].lon, WELLS[i].lat],
        [WELLS[j].lon, WELLS[j].lat],
      );
      if (dist < 150) {
        features.push({
          type: "Feature",
          properties: { distance: dist.toFixed(0) },
          geometry: {
            type: "LineString",
            coordinates: [
              [WELLS[i].lon, WELLS[i].lat],
              [WELLS[j].lon, WELLS[j].lat],
            ],
          },
        });
      }
    }
  }
  return { type: "FeatureCollection", features };
}

export function buildWellsGeoJSON(wells: Well[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: wells.map((w) => ({
      type: "Feature",
      properties: { id: w.id, name: w.name, wellType: w.wellType, status: w.status, padId: w.padId },
      geometry: { type: "Point", coordinates: [w.lon, w.lat] },
    })),
  };
}

export function buildPopupHTML(well: Well, col: string, isActive: boolean): string {
  const tempCol = isActive ? "#b8bb26" : "#5a524a";
  const flowCol = isActive ? "#83a598" : "#5a524a";
  const activeBtnStyle = isActive
    ? "background:#83a598;color:#0c0e10;"
    : "background:#32302f;color:#5a524a;";

  return /* html */ `
    <div>
      <div class="pop-header">
        <div class="pop-dot" style="background:${col};${isActive ? `box-shadow:0 0 7px ${col};` : ""}"></div>
        <div style="flex:1;">
          <div class="pop-name">${well.name}</div>
          <div class="pop-sub">${WELL_TYPE_LABEL[well.wellType]} · ${STATUS_LABEL[well.status]}</div>
        </div>
      </div>

      <div class="pop-body">
        <div>
          <div class="pop-val" style="color:${tempCol};">${well.temperature}</div>
          <div class="pop-label">Temperature</div>
        </div>
        <div>
          <div class="pop-val" style="color:${flowCol};">${well.flowRate}</div>
          <div class="pop-label">Flow Rate</div>
        </div>
        <div>
          <div class="pop-val" style="color:#ebdbb2;">${well.pressure}</div>
          <div class="pop-label">Pressure</div>
        </div>
        <div>
          <div class="pop-val" style="color:#a89984;">${well.targetDepth}</div>
          <div class="pop-label">TD Target</div>
        </div>
      </div>

      <div class="pop-btn-wrap">
        <button
          class="pop-btn"
          onclick="window.__rtdc_enter('${well.id}')"
          style="${activeBtnStyle}"
          ${!isActive ? "disabled" : ""}
        >${isActive ? "Enter Control Room →" : "Unavailable"}</button>
      </div>
    </div>`;
}

export const POPUP_STYLES = `
  /* Density-aware popup — all sizes scale with --fs-scale */
  .rtdc-popup .maplibregl-popup-content {
    background: rgba(34,38,42,0.96);
    backdrop-filter: blur(12px);
    border: 1px solid #3c3836;
    border-radius: 4px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.7);
    padding: 0;
    font-size: calc(0.75rem * var(--fs-scale, 1));
    font-family: 'Barlow Condensed', sans-serif;
    color: #ebdbb2;
    line-height: 1.3;
  }
  .rtdc-popup .maplibregl-popup-tip {
    border-top-color: #3c3836;
    border-bottom-color: #3c3836;
  }
  .rtdc-popup .maplibregl-popup-close-button {
    color: #5a524a;
    font-size: calc(1rem * var(--fs-scale, 1));
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

  /* Popup internal sections */
  .pop-header {
    padding: calc(12px * var(--fs-scale, 1)) calc(14px * var(--fs-scale, 1)) calc(10px * var(--fs-scale, 1));
    border-bottom: 1px solid #3c3836;
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .pop-dot {
    width: 8px; height: 8px; border-radius: 50%;
    margin-top: 5px; flex-shrink: 0;
  }
  .pop-name {
    font-size: calc(0.875rem * var(--fs-scale, 1));
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1.2;
  }
  .pop-sub {
    font-size: calc(0.625rem * var(--fs-scale, 1));
    color: #a89984;
    margin-top: 2px;
    line-height: 1.2;
  }
  .pop-body {
    padding: calc(10px * var(--fs-scale, 1)) calc(14px * var(--fs-scale, 1));
    border-bottom: 1px solid #3c3836;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .pop-val {
    font-family: 'Share Tech Mono', monospace;
    font-size: calc(0.8125rem * var(--fs-scale, 1));
    line-height: 1.2;
  }
  .pop-label {
    font-size: calc(0.5rem * var(--fs-scale, 1));
    color: #5a524a;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    line-height: 1.2;
  }
  .pop-btn-wrap {
    padding: calc(10px * var(--fs-scale, 1)) calc(14px * var(--fs-scale, 1));
  }
  .pop-btn {
    width: 100%;
    padding: calc(8px * var(--fs-scale, 1));
    border: none;
    border-radius: 3px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: calc(0.6875rem * var(--fs-scale, 1));
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.15s;
    cursor: pointer;
  }
  .pop-btn[disabled] {
    cursor: not-allowed;
  }

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
  @keyframes slide-in-right {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: none; opacity: 1; }
  }
`;

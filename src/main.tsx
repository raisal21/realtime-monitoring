import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@/store/dom-sync";
import App from "@/App";
import { globalRigStore } from "@/store/index-store";
import { binMinMax } from "@/lib/bin-mm";
import { getTickCount } from "@/lib/chart-ticks";

// Dev-only debug handle for the Layer 2 smoke tests (see TODO.md "Verify").
// import.meta.env.DEV is false in production builds, so this block and the
// three imports above are dropped by the bundler.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__layer2 = {
    store: globalRigStore,
    binMinMax,
    getTickCount,
  };
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

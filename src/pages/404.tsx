"use client";

import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Terrain from "@/components/ui/terrain";
import type { TerrainPreset } from "@/components/ui/terrain";

export default function NotFoundPage({
  defaultPreset = "gruvbox",
}: {
  defaultPreset?: TerrainPreset;
}) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <Terrain preset={defaultPreset} className="fixed inset-0 -z-10" />

      <div className="glass animate-fade-up relative z-10 max-w-md w-full mx-4 p-8 text-center">
        <div className="text-8xl font-['Barlow_Condensed',sans-serif] font-extrabold tracking-wider text-(--theme-fg-emphasis)">
          404
        </div>
        <h1 className="text-2xl font-['Barlow_Condensed',sans-serif] font-bold tracking-[0.03em] text-(--theme-fg) mt-2">
          Not Found
        </h1>
        <p className="font-['Barlow',sans-serif] text-fs-12 text-(--theme-fg-muted) leading-relaxed mt-4">
          The route you requested doesn't exist on this rig. Check the URL or
          head back to the control room.
        </p>
        <button
          type="button"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-[3px] bg-(--theme-accent) text-(--theme-base) font-['Barlow_Condensed',sans-serif] font-bold text-fs-13 tracking-[0.16em] uppercase hover:opacity-90 transition-opacity"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back to Home
        </button>
      </div>
    </div>
  );
}

/* eslint-disable react-refresh/only-export-components */
import { createContext, use, useMemo, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { getWellById, type Well } from "@/data/wells";

interface CurrentWellValue {
  well: Well | null;
  wellId: string | null;
}

const CurrentWellContext = createContext<CurrentWellValue | null>(null);

export function CurrentWellProvider({ children }: { children: ReactNode }) {
  const { wellId } = useParams<{ wellId?: string }>();

  const value = useMemo<CurrentWellValue>(() => {
    if (!wellId) return { well: null, wellId: null };
    const resolved = getWellById(wellId);
    return resolved
      ? { well: resolved, wellId: resolved.id }
      : { well: null, wellId: null };
  }, [wellId]);

  return (
    <CurrentWellContext.Provider value={value}>
      {children}
    </CurrentWellContext.Provider>
  );
}

export function useCurrentWell(): CurrentWellValue {
  const ctx = use(CurrentWellContext);
  if (!ctx) {
    throw new Error("useCurrentWell must be used inside CurrentWellProvider");
  }
  return ctx;
}

export function useOptionalCurrentWell(): CurrentWellValue | null {
  return use(CurrentWellContext);
}

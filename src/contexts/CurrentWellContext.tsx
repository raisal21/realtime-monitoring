import { createContext, useContext, useMemo, type ReactNode } from "react";
import { WELLS, getWellById, type Well } from "@/data/wells";

interface CurrentWellValue {
  well: Well;
  wellId: string;
}

const CurrentWellContext = createContext<CurrentWellValue | null>(null);

const FALLBACK_WELL = WELLS[0];

export function CurrentWellProvider({
  wellId,
  children,
}: {
  wellId?: string;
  children: ReactNode;
}) {
  const value = useMemo<CurrentWellValue>(() => {
    const resolved = (wellId && getWellById(wellId)) || FALLBACK_WELL;
    return { well: resolved, wellId: resolved.id };
  }, [wellId]);

  return (
    <CurrentWellContext.Provider value={value}>
      {children}
    </CurrentWellContext.Provider>
  );
}

export function useCurrentWell(): CurrentWellValue {
  const ctx = useContext(CurrentWellContext);
  if (!ctx) {
    throw new Error("useCurrentWell must be used inside CurrentWellProvider");
  }
  return ctx;
}

export function useOptionalCurrentWell(): CurrentWellValue | null {
  return useContext(CurrentWellContext);
}

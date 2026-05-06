import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ChartProvider } from "@/stores/app-store";
import { AuthenticatedLayout } from "@/layouts/AuthenticatedLayout";
import { GuestGuard } from "@/guards/GuestGuard";
import { AuthGuard } from "@/guards/AuthGuard";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const WellExplorer = lazy(() => import("@/pages/WellExplorer"));
const Auth = lazy(() => import("@/pages/Auth"));
const NotFoundPage = lazy(() => import("@/pages/404"));

function RouteFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-(--theme-base)">
      <span className="status-dot animate-pulse-critical" data-status="ok" />
    </div>
  );
}

function PrewarmRoutes() {
  useEffect(() => {
    const idle = (cb: () => void) => {
      const w = window as unknown as {
        requestIdleCallback?: (cb: () => void) => number;
      };
      if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(cb);
      else setTimeout(cb, 200);
    };
    idle(() => {
      void import("@/pages/WellExplorer");
      void import("@/pages/Dashboard");
    });
  }, []);
  return null;
}

export function AppRoutes() {
  return (
    <>
      <PrewarmRoutes />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/wells" replace />} />
          <Route
            path="/auth"
            element={
              <GuestGuard>
                <Auth />
              </GuestGuard>
            }
          />

          {/* Authenticated Routes wrapped in a single Layout */}
          <Route
            element={
              <AuthGuard>
                <AuthenticatedLayout />
              </AuthGuard>
            }
          >
            {/* Wells Routes */}
            <Route path="/wells" element={<WellExplorer />} />
            <Route path="/wells/:wellId" element={<WellExplorer />} />

            {/* Dashboard Routes (optional wellId param) */}
            <Route
              path="/dashboard/:wellId?"
              element={
                <ChartProvider>
                  <Dashboard />
                </ChartProvider>
              }
            />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

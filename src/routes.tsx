import { Routes, Route, Navigate } from "react-router-dom";
import { ChartProvider } from "@/stores/app-store";
import { CurrentWellProvider } from "@/contexts/CurrentWellContext";
import { AuthenticatedLayout } from "@/layouts/AuthenticatedLayout";
import { GuestGuard } from "@/guards/GuestGuard";
import Dashboard from "@/pages/Dashboard";
import WellExplorer from "@/pages/WellExplorer";
import Auth from "@/pages/Auth";
import NotFoundPage from "@/pages/404";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/wells" replace />} />
      <Route path="/auth" element={
        <GuestGuard>
          <Auth />
        </GuestGuard>
      } />

      {/* Authenticated Routes wrapped in a single Layout */}
      <Route element={<AuthenticatedLayout />}>
        {/* Wells Routes */}
        <Route path="/wells" element={<WellExplorer />} />
        <Route
          path="/wells/:wellId"
          element={
            <CurrentWellProvider>
              <WellExplorer />
            </CurrentWellProvider>
          }
        />

        {/* Dashboard Routes (optional wellId param) */}
        <Route
          path="/dashboard/:wellId?"
          element={
            <CurrentWellProvider>
              <ChartProvider>
                <Dashboard />
              </ChartProvider>
            </CurrentWellProvider>
          }
        />
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

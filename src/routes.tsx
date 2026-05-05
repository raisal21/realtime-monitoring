import { Routes, Route, Navigate, useParams } from "react-router-dom";
import {
  UiProvider,
  ChartProvider,
  SettingsProvider,
} from "@/stores/dashboard-store";
import { CurrentWellProvider } from "@/contexts/CurrentWellContext";
import Dashboard from "@/pages/Dashboard";
import WellExplorer from "@/pages/WellExplorer";
import Auth from "@/pages/Auth";
import NotFoundPage from "@/pages/404";

// Wrapper component to inject wellId into Dashboard
function DashboardWithWellId() {
  const { wellId } = useParams<{ wellId?: string }>();
  return (
    <CurrentWellProvider wellId={wellId}>
      <UiProvider>
        <ChartProvider>
          <SettingsProvider>
            <Dashboard />
          </SettingsProvider>
        </ChartProvider>
      </UiProvider>
    </CurrentWellProvider>
  );
}

// Wrapper component to inject well selection into WellExplorer
function WellExplorerWithProviders() {
  const { wellId } = useParams<{ wellId?: string }>();
  return (
    <CurrentWellProvider wellId={wellId}>
      <UiProvider>
        <SettingsProvider>
          <WellExplorer />
        </SettingsProvider>
      </UiProvider>
    </CurrentWellProvider>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/wells" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/wells" element={<WellExplorerWithProviders />} />
      <Route path="/wells/:wellId" element={<WellExplorerWithProviders />} />
      <Route path="/dashboard" element={<DashboardWithWellId />} />
      <Route path="/dashboard/:wellId" element={<DashboardWithWellId />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

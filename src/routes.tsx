import { Routes, Route, Navigate, useParams } from "react-router-dom";
import {
  UiProvider,
  ChartProvider,
  SettingsProvider,
} from "@/stores/dashboard-store";
import Dashboard from "@/pages/Dashboard";
import WellExplorer from "@/pages/WellExplorer";
import Auth from "@/pages/Auth";
import AuthPage from "./pages/Auth02";

// Wrapper component to inject wellId into Dashboard
function DashboardWithWellId() {
  const { wellId } = useParams<{ wellId?: string }>();
  return (
    <UiProvider>
      <ChartProvider>
        <SettingsProvider>
          <Dashboard wellId={wellId} />
        </SettingsProvider>
      </ChartProvider>
    </UiProvider>
  );
}

// Wrapper component to inject well selection into WellExplorer
function WellExplorerWithProviders() {
  return (
    <UiProvider>
      <SettingsProvider>
        <WellExplorer />
      </SettingsProvider>
    </UiProvider>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/wells" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth2" element={<AuthPage />} />
      <Route path="/wells" element={<WellExplorerWithProviders />} />
      <Route path="/wells/:wellId" element={<WellExplorerWithProviders />} />
      <Route path="/dashboard" element={<DashboardWithWellId />} />
      <Route path="/dashboard/:wellId" element={<DashboardWithWellId />} />
    </Routes>
  );
}

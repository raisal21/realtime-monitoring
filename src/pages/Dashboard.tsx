"use client";

import { UiProvider, ChartProvider, SettingsProvider } from "../stores/dashboard-store.tsx";
import { DashboardLayout } from "../components/dashboard/DashboardLayout.tsx";

export default function Dashboard() {
  return (
    <UiProvider>
      <ChartProvider>
        <SettingsProvider>
          <DashboardLayout />
        </SettingsProvider>
      </ChartProvider>
    </UiProvider>
  );
}
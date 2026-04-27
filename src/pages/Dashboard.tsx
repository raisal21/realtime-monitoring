"use client";

import { UiProvider, ChartProvider, SettingsProvider } from "@/stores/dashboard-store";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

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
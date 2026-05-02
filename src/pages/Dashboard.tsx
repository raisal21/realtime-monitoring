"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function Dashboard({ wellId }: { wellId?: string }) {
  return <DashboardLayout wellId={wellId} />;
}
import { Outlet } from "react-router-dom";
import { UiProvider, SettingsProvider } from "@/stores/app-store";
import { UniversalTopbar } from "@/components/shell/UniversalTopbar";

export function AuthenticatedLayout() {
  return (
    <SettingsProvider>
      <UiProvider>
        <div className="flex flex-col h-screen overflow-hidden">
          <UniversalTopbar />
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        </div>
      </UiProvider>
    </SettingsProvider>
  );
}

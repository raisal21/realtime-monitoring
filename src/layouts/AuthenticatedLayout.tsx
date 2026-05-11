import { Outlet, useNavigate, useParams } from "react-router-dom";
import { CurrentWellProvider } from "@/contexts/CurrentWellContext";
import { UniversalTopbar } from "@/components/app-shell/UniversalTopbar";
import { useAuth } from "@/hooks/useAuth";
import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle } from "@/components/ui/popover";
import { TopbarButton } from "@/components/ui/navigation";
import { LogOut, CircleUser, ShieldCheck } from "lucide-react";

export function AuthenticatedLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { wellId } = useParams<{ wellId?: string }>();

  const handleLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  const profileSlot = (
    <Popover>
      <PopoverTrigger render={
        <TopbarButton title="User profile" aria-label="User profile">
          <CircleUser size={16} strokeWidth={2} />
        </TopbarButton>
      } />
      <PopoverContent className="min-w-[200px]">
        <PopoverHeader className="pb-2">
          <PopoverTitle className="flex items-center gap-2">
            <ShieldCheck size={14} strokeWidth={2} className="text-(--theme-accent)" />
            Operator Signed In
          </PopoverTitle>
        </PopoverHeader>
        <div className="px-rt-pad py-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-fs-12 text-(--theme-fg-muted) hover:text-(--theme-critical) hover:bg-(--theme-overlay) rounded-sm cursor-pointer transition-colors"
          >
            <LogOut size={14} strokeWidth={2} />
            <span className="font-['Barlow_Condensed',sans-serif] uppercase tracking-[0.08em]">
              Sign Out
            </span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <CurrentWellProvider wellId={wellId}>
      <div className="flex flex-col h-screen overflow-hidden">
        <UniversalTopbar profileSlot={profileSlot} />
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </CurrentWellProvider>
  );
}

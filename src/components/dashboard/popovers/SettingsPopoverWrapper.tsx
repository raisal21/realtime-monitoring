import { useUi } from "@/stores/app-store";
import {
  Popover,
  PopoverTrigger,
} from "@/components/popover";
import { SettingsPopoverContent } from "@/components/dashboard/popovers/SettingsPopover";

export function SettingsPopoverWrapper() {
  const { state: ui, dispatch } = useUi();
  return (
    <Popover
      open={ui.settingsPopover}
      onOpenChange={(open: boolean) => dispatch({ type: "SET_SETTINGS_POPOVER", open })}
    >
      <PopoverTrigger
        render={
          <button
            data-settings-popover-anchor
            className="absolute top-3 right-20 size-px opacity-0 pointer-events-none"
            aria-hidden="true"
            tabIndex={-1}
          />
        }
      />
      <SettingsPopoverContent />
    </Popover>
  );
}
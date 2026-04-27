import { useUi } from "../../../stores/dashboard-store.tsx";
import {
  Popover,
  PopoverTrigger,
} from "../../../components";
import { SettingsPopoverContent } from "./SettingsPopover";

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
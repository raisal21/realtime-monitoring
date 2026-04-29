import { Monitor, BellRing } from "lucide-react";
import {
  useSettings,
  type Theme,
  type Density,
  type FontSize,
} from "@/stores/dashboard-store";
import { THEMES } from "@/data/dashboard-static";
import {
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@/components/popover";
import { RadioCard, RadioCardGroup } from "@/components/form";
import { ToggleGroup, ToggleItem } from "@/components/core";
import { Switch } from "@/components/form";
import type { ReactNode } from "react";

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-['Barlow',sans-serif] text-[12px] text-(--theme-fg-muted)">
        {label}
      </span>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export function SettingsPopoverContent() {
  const { state, dispatch } = useSettings();

  return (
    <PopoverContent
      align="end"
      sideOffset={8}
      popupClassName="w-[360px] max-h-[540px] overflow-y-auto scrollbar-thin"
    >
      <PopoverHeader>
        <PopoverTitle>Settings</PopoverTitle>
        <PopoverDescription>
          Personal preferences for this session
        </PopoverDescription>
      </PopoverHeader>

      <div className="px-4 py-3 border-b border-(--theme-border)">
        <div className="flex items-center gap-1.5 mb-2">
          <Monitor
            size={11}
            strokeWidth={2}
            className="text-(--theme-fg-dim)"
          />
          <span className="section-heading">Display</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <div>
            <span className="font-['Barlow',sans-serif] text-[12px] text-(--theme-fg-muted) block mb-2">
              Theme
            </span>
            <RadioCardGroup
              value={state.theme}
              onValueChange={(v) =>
                v && dispatch({ type: "SET_THEME", theme: v as Theme })
              }
              className="flex flex-col gap-1.5"
            >
              {THEMES.map((t) => (
                <RadioCard
                  key={t.id}
                  value={t.id}
                  size="sm"
                  icon={
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ background: t.swatch }}
                    />
                  }
                  title={t.name}
                  subtitle={t.subtitle}
                />
              ))}
            </RadioCardGroup>
          </div>

          <SettingRow label="Density">
            <ToggleGroup
              value={[state.density] as readonly string[]}
              onValueChange={(v: readonly string[]) =>
                v &&
                v[0] &&
                dispatch({ type: "SET_DENSITY", density: v[0] as Density })
              }
            >
              <ToggleItem value="compact">Compact</ToggleItem>
              <ToggleItem value="comfortable">Comfort</ToggleItem>
            </ToggleGroup>
          </SettingRow>

          <SettingRow label="Font Size">
            <ToggleGroup
              value={[state.fontSize] as readonly string[]}
              onValueChange={(v: readonly string[]) =>
                v &&
                v[0] &&
                dispatch({ type: "SET_FONT_SIZE", size: v[0] as FontSize })
              }
            >
              <ToggleItem value="sm">SM</ToggleItem>
              <ToggleItem value="md">MD</ToggleItem>
              <ToggleItem value="lg">LG</ToggleItem>
            </ToggleGroup>
          </SettingRow>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <BellRing
            size={11}
            strokeWidth={2}
            className="text-(--theme-fg-dim)"
          />
          <span className="section-heading">Alerts</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <SettingRow label="Sound">
            <Switch
              checked={state.soundEnabled}
              onCheckedChange={() => dispatch({ type: "TOGGLE_SOUND" })}
            />
          </SettingRow>
        </div>
      </div>
    </PopoverContent>
  );
}


// ============================================================================
// RTDC — Component Library Barrel Exports
// Base UI primitives · CVA variants · Tailwind v4 · lucide-react icons
// ============================================================================

// Utility
export { cn } from "../lib/utils";

// Core Primitives
export {
  Button,
  type ButtonProps,
  Input,
  type InputProps,
  Surface,
  type SurfaceProps,
  Badge,
  type BadgeProps,
  StatusDot,
  type StatusDotProps,
  ToggleGroup,
  ToggleItem,
  TraceColor,
  type TraceColorProps,
} from "./core";

// Telemetry Display
export {
  ValueReadout,
  type ValueReadoutProps,
  GaugeCard,
  type GaugeCardProps,
  GaugeCardCompact,
  type GaugeCardCompactProps,
  TraceItem,
  type TraceItemProps,
  TraceToggle,
  type TraceToggleProps,
} from "./telemetry";

// Alarm System
export {
  FilterChip,
  type FilterChipProps,
  FeedItem,
  type FeedItemProps,
  CriticalBanner,
  type CriticalBannerProps,
} from "./alarm";

// Navigation Shell
export {
  TopbarButton,
  type TopbarButtonProps,
  BreadcrumbItem,
  type BreadcrumbItemProps,
} from "./navigation";

// Well Explorer
export {
  WellListItem,
  type WellListItemProps,
  WellMetric,
  type WellMetricProps,
  SidebarStat,
  type SidebarStatProps,
} from "./well";

// Footer
export {
  ConnectionStatus,
  type ConnectionStatusProps,
  FooterStat,
  type FooterStatProps,
} from "./footer";

// Preset Select
export {
  PresetSelect,
  type PresetSelectProps,
} from "./select";

// Popover
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  type PopoverContentProps,
  PopoverHeader,
  type PopoverHeaderProps,
  PopoverTitle,
  type PopoverTitleProps,
  PopoverDescription,
  type PopoverDescriptionProps,
} from "./popover";

// Form Components
export {
  Switch,
  type SwitchProps,
  IconButton,
  type IconButtonProps,
  RadioCardGroup,
  RadioCard,
  type RadioCardProps,
  Slider,
  type SliderProps,
} from "./form";

// Display Components
export {
  LiveBadge,
  type LiveBadgeProps,
  RangePresetButton,
  type RangePresetButtonProps,
  TrackFooterRow,
  type TrackFooterRowProps,
  RailSection,
  type RailSectionProps,
} from "./display";

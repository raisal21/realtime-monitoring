import type { StateCreator } from "zustand";
import type { GlobalRigState } from "../store.types";

export type UiState = {
  gaugeSidebar: "open" | "closed";
  alarmSidebar: "open" | "closed";
  leftRail: "expanded" | "collapsed";
  settingsPopover: boolean;
  zoomPopover: boolean;
  displayLayoutPopover: boolean;
  ackModal: { open: boolean; alarmId: string | null };
  alarmFilters: { critical: boolean; warning: boolean; info: boolean };
};

export interface UiActions {
  toggleGaugeSidebar: () => void;
  toggleAlarmSidebar: () => void;
  toggleBothSidebars: () => void;
  toggleLeftRail: () => void;
  setLeftRail: (value: UiState["leftRail"]) => void;
  setSettingsPopover: (open: boolean) => void;
  setZoomPopover: (open: boolean) => void;
  setDisplayLayoutPopover: (open: boolean) => void;
  openAckModal: (alarmId: string) => void;
  closeAckModal: () => void;
  toggleAlarmFilter: (filter: keyof UiState["alarmFilters"]) => void;
}

export interface UiSlice extends UiActions {
  ui: UiState;
}

const uiInitial: UiState = {
  gaugeSidebar: "closed",
  alarmSidebar: "open",
  leftRail: "expanded",
  settingsPopover: false,
  zoomPopover: false,
  displayLayoutPopover: false,
  ackModal: { open: false, alarmId: null },
  alarmFilters: { critical: true, warning: true, info: true },
};

export const createUiSlice: StateCreator<GlobalRigState, [], [], UiSlice> = (
  set,
) => ({
  ui: uiInitial,

  toggleGaugeSidebar: () =>
    set((s) => ({
      ui: {
        ...s.ui,
        gaugeSidebar: s.ui.gaugeSidebar === "open" ? "closed" : "open",
      },
    })),

  toggleAlarmSidebar: () =>
    set((s) => ({
      ui: {
        ...s.ui,
        alarmSidebar: s.ui.alarmSidebar === "open" ? "closed" : "open",
      },
    })),

  toggleBothSidebars: () =>
    set((s) => {
      const target =
        s.ui.gaugeSidebar === "open" && s.ui.alarmSidebar === "open"
          ? "closed"
          : "open";
      return { ui: { ...s.ui, gaugeSidebar: target, alarmSidebar: target } };
    }),

  toggleLeftRail: () =>
    set((s) => ({
      ui: {
        ...s.ui,
        leftRail: s.ui.leftRail === "expanded" ? "collapsed" : "expanded",
      },
    })),

  setLeftRail: (value) =>
    set((s) => ({ ui: { ...s.ui, leftRail: value } })),

  setSettingsPopover: (open) =>
    set((s) => ({ ui: { ...s.ui, settingsPopover: open } })),

  setZoomPopover: (open) =>
    set((s) => ({ ui: { ...s.ui, zoomPopover: open } })),

  setDisplayLayoutPopover: (open) =>
    set((s) => ({ ui: { ...s.ui, displayLayoutPopover: open } })),

  openAckModal: (alarmId) =>
    set((s) => ({ ui: { ...s.ui, ackModal: { open: true, alarmId } } })),

  closeAckModal: () =>
    set((s) => ({
      ui: { ...s.ui, ackModal: { open: false, alarmId: null } },
    })),

  toggleAlarmFilter: (filter) =>
    set((s) => ({
      ui: {
        ...s.ui,
        alarmFilters: {
          ...s.ui.alarmFilters,
          [filter]: !s.ui.alarmFilters[filter],
        },
      },
    })),
});

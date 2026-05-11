import type { StateCreator } from "zustand";
import type { GlobalRigState } from "../store.types";

export type ToastTone = "error" | "warning" | "info";

export interface ToastEntry {
  id: string;
  tone: ToastTone;
  code: string;
  message: string;
  createdAt: number;
}

export interface ToastActions {
  pushToast: (
    input: { tone: ToastTone; code: string; message: string },
  ) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

export interface ToastSlice extends ToastActions {
  toasts: ToastEntry[];
}

let toastSeq = 0;

export const createToastSlice: StateCreator<
  GlobalRigState,
  [],
  [],
  ToastSlice
> = (set) => ({
  toasts: [],

  pushToast: ({ tone, code, message }) => {
    const id = `t-${Date.now()}-${++toastSeq}`;
    const entry: ToastEntry = {
      id,
      tone,
      code,
      message,
      createdAt: Date.now(),
    };
    set((s) => ({ toasts: [...s.toasts, entry] }));
    return id;
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  clearToasts: () => set({ toasts: [] }),
});

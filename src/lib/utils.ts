import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Register custom `text-fs-*` utilities as font-size so twMerge does not
// classify them as text-color. Without this, they collide with classes like
// `text-(--theme-fg)` in shared CVA wrappers and get stripped during merge,
// which silently breaks the runtime font-size scaling.
// Density spacing tokens (--spacing-rt-*). Registering them lets twMerge
// classify `p-rt-pad`, `gap-rt-gap`, etc. as the right group so they don't
// collide with other padding/gap utilities in CVA wrappers.
const RT_PAD = ["rt-pad-xs", "rt-pad-sm", "rt-pad", "rt-pad-lg"];
const RT_GAP = ["rt-gap-sm", "rt-gap", "rt-gap-lg"];
const RT_SIZE = [
  "rt-row-h", "rt-ctrl-h",
  "rt-shell-top", "rt-shell-sub", "rt-shell-foot",
];
const RT_ALL_SPACING = [...RT_PAD, ...RT_GAP, ...RT_SIZE];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "fs-7", "fs-8", "fs-9", "fs-10", "fs-11", "fs-12",
            "fs-13", "fs-14", "fs-15", "fs-16", "fs-18",
            "fs-24", "fs-28", "fs-36",
          ],
        },
      ],
      "p":   [{ p:   RT_ALL_SPACING }],
      "px":  [{ px:  RT_ALL_SPACING }],
      "py":  [{ py:  RT_ALL_SPACING }],
      "pt":  [{ pt:  RT_ALL_SPACING }],
      "pr":  [{ pr:  RT_ALL_SPACING }],
      "pb":  [{ pb:  RT_ALL_SPACING }],
      "pl":  [{ pl:  RT_ALL_SPACING }],
      "m":   [{ m:   RT_ALL_SPACING }],
      "mx":  [{ mx:  RT_ALL_SPACING }],
      "my":  [{ my:  RT_ALL_SPACING }],
      "mt":  [{ mt:  RT_ALL_SPACING }],
      "mr":  [{ mr:  RT_ALL_SPACING }],
      "mb":  [{ mb:  RT_ALL_SPACING }],
      "ml":  [{ ml:  RT_ALL_SPACING }],
      "gap": [{ gap: RT_GAP }],
      "gap-x": [{ "gap-x": RT_GAP }],
      "gap-y": [{ "gap-y": RT_GAP }],
      "h":   [{ h:   RT_SIZE }],
      "min-h": [{ "min-h": RT_SIZE }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

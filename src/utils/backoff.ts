// utils/backoff.ts

import {
  BACKOFF_BASE_MS,
  BACKOFF_CAP_MS,
  MAX_RETRY_ATTEMPTS,
  MAX_RETRY_ELAPSED_MS,
} from "../domain/constants";

function getRandom(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

type BackoffResult =
  | { shouldRetry: true; delayMs: number }
  | { shouldRetry: false; reason: "MAX_ATTEMPTS" | "MAX_ELAPSED" };

type Backoff = {
  next(): BackoffResult;
  reset(): void;
};

export function createBackoff(): Backoff {
  let attempt = 0;
  let prevDelay = BACKOFF_BASE_MS;
  let startedAt: number | null = null;

  return {
    next(): BackoffResult {
      if (startedAt === null) startedAt = Date.now();

      const elapsed = Date.now() - startedAt;

      if (attempt >= MAX_RETRY_ATTEMPTS) {
        return { shouldRetry: false, reason: "MAX_ATTEMPTS" };
      }

      if (elapsed >= MAX_RETRY_ELAPSED_MS) {
        return { shouldRetry: false, reason: "MAX_ELAPSED" };
      }

      // Decorrelated jitter — distribusi lebih merata dibanding full jitter
      // sleep = min(CAP, random(BASE, prev * 3))
      const delayMs = Math.min(
        BACKOFF_CAP_MS,
        getRandom(BACKOFF_BASE_MS, prevDelay * 3),
      );

      prevDelay = delayMs;
      attempt++;

      return { shouldRetry: true, delayMs };
    },

    reset() {
      attempt = 0;
      prevDelay = BACKOFF_BASE_MS;
      startedAt = null;
    },
  };
}

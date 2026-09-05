import { useState, useEffect } from 'react';

let activeEventViews = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Lazy live clock - only runs when at least one event view is mounted.
 * Uses reference counting to start/stop a single shared 30s interval.
 */
export function useLiveClock(): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    activeEventViews++;

    if (activeEventViews === 1 && intervalId === null) {
      // First event view mounted — START the clock
      intervalId = setInterval(() => setNow(Date.now()), 30000);
    }

    return () => {
      activeEventViews--;
      if (activeEventViews === 0 && intervalId !== null) {
        // Last event view unmounted — STOP the clock
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  }, []);

  return now;
}
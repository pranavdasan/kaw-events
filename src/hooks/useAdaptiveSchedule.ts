import { useState, useEffect, useMemo } from 'react';
import { Session } from '../types';
import { formatTimeTo12h } from '../utils';

export interface AdaptiveSession extends Session {
  calculatedStartTime: string;
  calculatedEndTime: string;
  startMinutes: number;
  endMinutes: number;
}

/**
 * Hook to calculate adaptive session times based on an event's start time.
 * This ensures durations stack correctly even if items are reordered.
 * Automatically determines if a session is currently LIVE when isAutoLiveMode is true.
 */
export function useAdaptiveSchedule(
  sessions: Session[], 
  dayStartTime: string,
  isAutoLiveMode: boolean = true
) {
  const [nowMins, setNowMins] = useState<number>(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    if (!isAutoLiveMode) return;

    const updateTime = () => {
      const d = new Date();
      setNowMins(d.getHours() * 60 + d.getMinutes());
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [isAutoLiveMode]);

  return useMemo((): AdaptiveSession[] => {
    const sorted = [...sessions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    let currentTime = dayStartTime;
    let currentOrder: number | null = null;
    let nextBlockTime = dayStartTime;

    return sorted.map(session => {
      const order = session.order ?? 0;
      if (currentOrder !== null && order !== currentOrder) {
        currentTime = nextBlockTime;
      }
      currentOrder = order;

      const start = currentTime;
      const [sh, sm] = start.split(':').map(Number);
      const startMinutes = (sh || 0) * 60 + (sm || 0);
      const endMinutes = startMinutes + session.durationInMin;

      const calculatedStartTime = formatTimeTo12h(start);

      const endH = Math.floor(endMinutes / 60) % 24;
      const endM = endMinutes % 60;
      const calculatedEndTime = formatTimeTo12h(`${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`);

      const currNextMins = nextBlockTime.split(':').reduce((h, m) => Number(h) * 60 + Number(m), 0);
      if (endMinutes > currNextMins) {
        nextBlockTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
      }

      const isLive = isAutoLiveMode
        ? (nowMins >= startMinutes && nowMins < endMinutes)
        : Boolean(session.isLive);

      return {
        ...session,
        isLive,
        calculatedStartTime,
        calculatedEndTime,
        startMinutes,
        endMinutes
      };
    });
  }, [sessions, dayStartTime, isAutoLiveMode, nowMins]);
}

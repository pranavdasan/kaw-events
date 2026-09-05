import { useMemo } from 'react';
import { Session } from '../types';
import { formatTimeTo12h } from '../utils';
import { useLiveClock } from './useLiveClock';

export interface AdaptiveSession extends Session {
  calculatedStartTime: string;
  calculatedEndTime: string;
  startMinutes: number;
  endMinutes: number;
}

interface CacheKey {
  eventId: string;
  sessionsLength: number;
  dayStartTime: string;
  isAutoLiveMode: boolean;
}

interface BaseSession extends Omit<AdaptiveSession, 'isLive'> {}

interface CacheEntry {
  key: CacheKey;
  baseSessions: BaseSession[];
}

const adaptiveScheduleCache = new Map<string, CacheEntry>();

function createCacheKey(eventId: string, sessions: Session[], dayStartTime: string, isAutoLiveMode: boolean): string {
  return `${eventId}-${sessions.length}-${dayStartTime}-${isAutoLiveMode}`;
}

function computeBaseSessions(sessions: Session[], dayStartTime: string): BaseSession[] {
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

    return {
      ...session,
      calculatedStartTime,
      calculatedEndTime,
      startMinutes,
      endMinutes,
    };
  });
}

/**
 * Hook to calculate adaptive session times based on an event's start time.
 * Uses a shared cache keyed by (eventId, sessions[], dayStartTime, isAutoLiveMode).
 * Live status is computed reactively using a shared lazy clock.
 */
export function useAdaptiveSchedule(
  sessions: Session[],
  dayStartTime: string,
  isAutoLiveMode: boolean = true,
  eventId: string = 'default'
): AdaptiveSession[] {
  const nowMins = useLiveClock();

  return useMemo((): AdaptiveSession[] => {
    const cacheKey = createCacheKey(eventId, sessions, dayStartTime, isAutoLiveMode);
    const cached = adaptiveScheduleCache.get(cacheKey);

    let baseSessions: BaseSession[];

    if (cached && cached.key.eventId === eventId && 
        cached.key.sessionsLength === sessions.length &&
        cached.key.dayStartTime === dayStartTime &&
        cached.key.isAutoLiveMode === isAutoLiveMode) {
      baseSessions = cached.baseSessions;
    } else {
      baseSessions = computeBaseSessions(sessions, dayStartTime);
      adaptiveScheduleCache.set(cacheKey, {
        key: { eventId, sessionsLength: sessions.length, dayStartTime, isAutoLiveMode },
        baseSessions,
      });
    }

    return baseSessions.map((base, index) => {
      const originalSession = sessions[index];
      const isLive = isAutoLiveMode
        ? (nowMins >= base.startMinutes && nowMins < base.endMinutes)
        : originalSession.isLive;

      return {
        ...base,
        isLive,
      };
    });
  }, [sessions, dayStartTime, isAutoLiveMode, eventId, nowMins]);
}

/**
 * Clear the cache for a specific event (useful when sessions are mutated)
 */
export function invalidateAdaptiveScheduleCache(eventId?: string): void {
  if (eventId) {
    for (const key of adaptiveScheduleCache.keys()) {
      if (key.startsWith(`${eventId}-`)) {
        adaptiveScheduleCache.delete(key);
      }
    }
  } else {
    adaptiveScheduleCache.clear();
  }
}
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { Event, Session } from '../types';
import { publishPendingChanges as firestorePublishPendingChanges } from '../services/firestore';

interface PendingChangesContextValue {
  pendingEvents: Map<string, Event>;
  pendingSessions: Map<string, Session>;
  hasPendingChanges: boolean;
  originalEvents: Event[] | null;
  originalSessions: Session[] | null;
  markEventPending: (event: Event, currentEvents: Event[], currentSessions: Session[]) => void;
  markSessionPending: (session: Session, currentEvents: Event[], currentSessions: Session[]) => void;
  clearPendingChanges: () => void;
  publishPendingChanges: () => Promise<void>;
}

const PendingChangesContext = createContext<PendingChangesContextValue | null>(null);

interface PendingChangesProviderProps {
  children: React.ReactNode;
}

export function PendingChangesProvider({ children }: PendingChangesProviderProps) {
  const [pendingEvents, setPendingEvents] = useState<Map<string, Event>>(new Map());
  const [pendingSessions, setPendingSessions] = useState<Map<string, Session>>(new Map());
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [originalEvents, setOriginalEvents] = useState<Event[] | null>(null);
  const [originalSessions, setOriginalSessions] = useState<Session[] | null>(null);

  const markEventPending = useCallback((event: Event, currentEvents: Event[], currentSessions: Session[]) => {
    if (pendingEvents.size === 0 && pendingSessions.size === 0) {
      setOriginalEvents(currentEvents);
      setOriginalSessions(currentSessions);
    }
    setPendingEvents((prev) => new Map(prev).set(event.id, event));
    setHasPendingChanges(true);
  }, [pendingEvents.size, pendingSessions.size]);

  const markSessionPending = useCallback((session: Session, currentEvents: Event[], currentSessions: Session[]) => {
    if (pendingEvents.size === 0 && pendingSessions.size === 0) {
      setOriginalEvents(currentEvents);
      setOriginalSessions(currentSessions);
    }
    setPendingSessions((prev) => new Map(prev).set(session.id, session));
    setHasPendingChanges(true);
  }, [pendingEvents.size, pendingSessions.size]);

  const clearPendingChanges = useCallback(() => {
    setPendingEvents(new Map());
    setPendingSessions(new Map());
    setHasPendingChanges(false);
    setOriginalEvents(null);
    setOriginalSessions(null);
  }, []);

  const publishPendingChanges = useCallback(async () => {
    await firestorePublishPendingChanges(
      Array.from(pendingEvents.values()),
      Array.from(pendingSessions.values())
    );
    clearPendingChanges();
  }, [pendingEvents, pendingSessions, clearPendingChanges]);

  const value = useMemo(() => ({
    pendingEvents,
    pendingSessions,
    hasPendingChanges,
    originalEvents,
    originalSessions,
    markEventPending,
    markSessionPending,
    clearPendingChanges,
    publishPendingChanges,
  }), [pendingEvents, pendingSessions, hasPendingChanges, originalEvents, originalSessions]);

  return (
    <PendingChangesContext.Provider value={value}>
      {children}
    </PendingChangesContext.Provider>
  );
}

export function usePendingChanges(): PendingChangesContextValue {
  const context = useContext(PendingChangesContext);
  if (!context) {
    throw new Error('usePendingChanges must be used within a PendingChangesProvider');
  }
  return context;
}
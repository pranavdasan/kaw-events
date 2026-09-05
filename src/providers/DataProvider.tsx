import React, { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Event, Session, Participant } from '../types';
import {
  subscribeToEvents,
  subscribeToSessions,
  subscribeToPerformersByEvent,
} from '../services/firestore';
import { getDefaultEventId } from '../hooks/useDefaultEvent';

interface DataContextValue {
  events: Event[];
  sessions: Session[];
  performers: Participant[];
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  isAutoLiveMode: boolean;
  setIsAutoLiveMode: (mode: boolean) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

interface DataProviderProps {
  children: React.ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [performers, setPerformers] = useState<Participant[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isAutoLiveMode, setIsAutoLiveMode] = useState<boolean>(true);

  const subscriptionsRef = useRef<Array<() => void>>([]);

  // Parallel Firestore subscriptions
  useEffect(() => {
    // Subscribe to events (always)
    const unsubEvents = subscribeToEvents((firestoreEvents) => {
      setEvents(firestoreEvents);
      if (!selectedEventId && firestoreEvents.length > 0) {
        const defaultId = getDefaultEventId(firestoreEvents);
        if (defaultId) setSelectedEventId(defaultId);
      }
    });
    subscriptionsRef.current.push(unsubEvents);

    // Subscribe to sessions for selected event (parallel)
    let unsubSessions: (() => void) | null = null;
    if (selectedEventId) {
      unsubSessions = subscribeToSessions(selectedEventId, (firestoreSessions) => {
        setSessions(firestoreSessions);
      });
      subscriptionsRef.current.push(unsubSessions);
    }

    // Subscribe to performers for selected event (parallel)
    let unsubPerformers: (() => void) | null = null;
    if (selectedEventId) {
      unsubPerformers = subscribeToPerformersByEvent(selectedEventId, (firestorePerformers) => {
        setPerformers(firestorePerformers);
      });
      subscriptionsRef.current.push(unsubPerformers);
    }

    return () => {
      if (unsubSessions) unsubSessions();
      if (unsubPerformers) unsubPerformers();
      subscriptionsRef.current.forEach((unsub) => unsub());
      subscriptionsRef.current = [];
    };
  }, [selectedEventId]);

  const value = useMemo(() => ({
    events,
    sessions,
    performers,
    selectedEventId,
    setSelectedEventId,
    isAutoLiveMode,
    setIsAutoLiveMode,
  }), [events, sessions, performers, selectedEventId, isAutoLiveMode]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
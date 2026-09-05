import React, { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Event, Session, Participant } from '../types';
import {
  subscribeToEvents,
  subscribeToSessions,
  subscribeToPerformersByEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  createSession,
  updateSession,
  deleteSession,
  reorderSessions,
  createPerformer,
  getBookmarks,
  addBookmark,
  removeBookmark,
} from '../services/firestore';
import { invalidateAdaptiveScheduleCache } from '../hooks/useAdaptiveSchedule';
import { getDefaultEventId } from '../hooks/useDefaultEvent';
import { createSlug } from '../utils/imageUtils';

interface PendingEventMap { [key: string]: Event };
interface PendingSessionMap { [key: string]: Session };

interface OriginalEventMap { [key: string]: Event };
interface OriginalSessionMap { [key: string]: Session };

interface DataContextValue {
  events: Event[];
  sessions: Session[];
  performers: Participant[];
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;
  isAutoLiveMode: boolean;
  setIsAutoLiveMode: (mode: boolean) => void;
  toggleLive: (sessionId: string) => void;
  handleSaveEvent: (updatedEvent: Event) => void;
  handleDeleteEvent: (eventId: string) => void;
  handleSaveSession: (updatedSession: Session) => void;
  handleDeleteSession: (sessionId: string) => void;
  handleReorderSessions: (reordered: Session[]) => void;
  handleQuickAddSession: (title: string, duration: number) => void;
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
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isAutoLiveMode, setIsAutoLiveMode] = useState<boolean>(true);

  const [pendingEvents, setPendingEvents] = useState<PendingEventMap>({});
  const [pendingSessions, setPendingSessions] = useState<PendingSessionMap>({});
  const [originalEvents, setOriginalEvents] = useState<OriginalEventMap>({});
  const [originalSessions, setOriginalSessions] = useState<OriginalSessionMap>({});

  const subscriptionsRef = useRef<Array<() => void>>([]);

  // Parallel Firestore subscriptions
  useEffect(() => {
    const unsubEvents = subscribeToEvents((firestoreEvents) => {
      setEvents(firestoreEvents);
      if (!selectedEventId && firestoreEvents.length > 0) {
        const defaultId = getDefaultEventId(firestoreEvents);
        if (defaultId) setSelectedEventId(defaultId);
      }
    });
    subscriptionsRef.current.push(unsubEvents);

    let unsubSessions: (() => void) | null = null;
    if (selectedEventId) {
      unsubSessions = subscribeToSessions(selectedEventId, (firestoreSessions) => {
        setSessions(firestoreSessions);
      });
      subscriptionsRef.current.push(unsubSessions);
    }

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

  const markEventPending = useCallback((event: Event) => {
    setPendingEvents(prev => ({ ...prev, [event.id]: event }));
    setOriginalEvents(prev => ({ ...prev, [event.id]: { ...event } }));
  }, []);

  const markSessionPending = useCallback((session: Session) => {
    setPendingSessions(prev => ({ ...prev, [session.id]: session }));
    setOriginalSessions(prev => ({ ...prev, [session.id]: { ...session } }));
  }, []);

  const clearPendingChanges = useCallback(() => {
    setPendingEvents({});
    setPendingSessions({});
    setOriginalEvents({});
    setOriginalSessions({});
  }, []);

  const publishPendingChanges = useCallback(async () => {
    // Publish pending events
    const pendingEventIds = Object.keys(pendingEvents);
    for (const id of pendingEventIds) {
      const pendingEvent = pendingEvents[id];
      if (pendingEvent.id.startsWith("e-")) {
        // Already created, just update
        try {
          await updateEvent(pendingEvent.id, pendingEvent);
        } catch (err) {
          console.error("Failed to publish pending event:", err);
        }
      } else {
        // New event - create
        try {
          const newId = await createEvent(pendingEvent as any);
          setSelectedEventId(newId);
        } catch (err) {
          console.error("Failed to publish pending event create:", err);
        }
      }
    }

    // Publish pending sessions
    const pendingSessionIds = Object.keys(pendingSessions);
    for (const id of pendingSessionIds) {
      const pendingSession = pendingSessions[id];
      try {
        if (pendingSession.id.startsWith("s-")) {
          const newId = await createSession(pendingSession as any);
          // Update selected session id if needed
          if (pendingSession.id === selectedSessionId) {
            setSelectedSessionId(newId);
          }
        } else {
          await updateSession(pendingSession.id, pendingSession);
        }
      } catch (err) {
        console.error("Failed to publish pending session:", err);
      }
    }

    clearPendingChanges();
  }, [pendingEvents, pendingSessions, selectedSessionId, createEvent, updateEvent, createSession, updateSession]);

const toggleLive = useCallback((sessionId: string) => {
    setIsAutoLiveMode(false);
    const targetSession = sessions.find((s) => s.id === sessionId);
    if (targetSession) {
      const updated = { ...targetSession, isLive: !targetSession.isLive };
      updateSession(sessionId, updated).catch(console.error);
    }
  }, [sessions, setIsAutoLiveMode, updateSession]);

  const handleSaveEvent = useCallback(async (updatedEvent: Event) => {
    try {
      if (updatedEvent.id.startsWith("e-")) {
        const { id, ...eventData } = updatedEvent;
        const newId = await createEvent(eventData);
        setSelectedEventId(newId);
      } else {
        await updateEvent(updatedEvent.id, updatedEvent);
      }
      invalidateAdaptiveScheduleCache(updatedEvent.id);
      markEventPending(updatedEvent);
    } catch (err) {
      console.error("Failed to save event:", err);
      alert("Failed to save event. Please try again.");
    }
  }, [events, setSelectedEventId, invalidateAdaptiveScheduleCache, markEventPending, createEvent, updateEvent]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      if (selectedEventId === eventId) {
        const otherEvent = events.find((e) => e.id !== eventId);
        setSelectedEventId(otherEvent?.id || null);
      }
      invalidateAdaptiveScheduleCache(eventId);
    } catch (err) {
      console.error("Failed to delete event:", err);
      alert("Failed to delete event. Please try again.");
    }
  }, [selectedEventId, setSelectedEventId, events, invalidateAdaptiveScheduleCache, deleteEvent]);

  const handleSaveSession = useCallback(async (updatedSession: Session) => {
    console.log("handleSaveSession received:", updatedSession);

    if (updatedSession.isPending || updatedSession.id.startsWith("s-")) {
      const { isPending, ...sessionData } = updatedSession;
      try {
        const newId = await createSession(sessionData);
        if (selectedSessionId === updatedSession.id) {
          setSelectedSessionId(newId);
        }
      } catch (err) {
        console.error("Failed to create session:", err);
        alert("Failed to save session. Please try again.");
        return;
      }
    } else {
      try {
        await updateSession(updatedSession.id, updatedSession);
      } catch (err) {
        console.error("Failed to update session:", err);
        alert("Failed to save session. Please try again.");
        return;
      }
    }
    invalidateAdaptiveScheduleCache(updatedSession.eventId);
    markSessionPending(updatedSession.isPending ? { ...updatedSession, isPending: false } : updatedSession);
  }, [selectedSessionId, setSelectedSessionId, events, sessions, invalidateAdaptiveScheduleCache, markSessionPending, createSession, updateSession]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    try {
      const sessionToDelete = sessions.find((s) => s.id === sessionId);
      await deleteSession(sessionId);
      if (sessionToDelete) {
        invalidateAdaptiveScheduleCache(sessionToDelete.eventId);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
      alert("Failed to delete session. Please try again.");
    }
  }, [sessions, invalidateAdaptiveScheduleCache, deleteSession]);

  const handleReorderSessions = useCallback(async (reordered: Session[]) => {
    try {
      await reorderSessions(reordered);
    } catch (err) {
      console.error("Failed to reorder sessions:", err);
    }
    reordered.forEach((s) => markSessionPending(s));
    if (reordered.length > 0) {
      invalidateAdaptiveScheduleCache(reordered[0].eventId);
    }
  }, [events, sessions, markSessionPending, invalidateAdaptiveScheduleCache, reorderSessions]);

  const handleQuickAddSession = useCallback((title: string, duration: number) => {
    if (!selectedEventId) return;

    const eventDaySessions = sessions.filter((s) => s.eventId === selectedEventId);
    const maxOrder = eventDaySessions.reduce(
      (max, s) => Math.max(max, s.order ?? 0),
      -1,
    );

    const newSession: Session = {
      id: createSlug(`${selectedEventId}-${title}`),
      eventId: selectedEventId,
      title,
      description: "Quick added program item.",
      durationInMin: duration,
      track: "General",
      room: "Main Hall",
      participants: [],
      isLive: false,
      type: "break",
      order: maxOrder + 1,
    };

    invalidateAdaptiveScheduleCache(selectedEventId);
    markSessionPending(newSession);
  }, [selectedEventId, sessions, markSessionPending, invalidateAdaptiveScheduleCache, createSlug]);

  const value = useMemo(() => ({
    events,
    sessions,
    performers,
    selectedEventId,
    setSelectedEventId,
    selectedSessionId,
    setSelectedSessionId,
    isAutoLiveMode,
    setIsAutoLiveMode,
    toggleLive,
    handleSaveEvent,
    handleDeleteEvent,
    handleSaveSession,
    handleDeleteSession,
    handleReorderSessions,
    handleQuickAddSession,
  }), [events, sessions, performers, selectedEventId, setSelectedEventId, selectedSessionId, setSelectedSessionId, isAutoLiveMode, setIsAutoLiveMode, toggleLive, handleSaveEvent, handleDeleteEvent, handleSaveSession, handleDeleteSession, handleReorderSessions, handleQuickAddSession]);

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
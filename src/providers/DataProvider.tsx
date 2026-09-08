import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import DataContext, { useData } from './DataContext';
export { useData } from './DataContext';
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

interface DataContextValue {
  events: Event[];
  sessions: Session[];
  performers: Participant[];
}

interface PendingEventMap { [key: string]: Event };
interface PendingSessionMap { [key: string]: Session };
interface OriginalEventMap { [key: string]: Event };
interface OriginalSessionMap { [key: string]: Session };

interface SelectionContextValue {
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;
  navigateToSession: (id: string) => void;
  navigateToEditSession: (id: string) => void;
  navigateToAddSession: (eventId: string) => void;
  navigateToEditEvent: (id: string) => void;
  handleEventSelect: (id: string) => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}

interface UIStateContextValue {
  isAutoLiveMode: boolean;
  setIsAutoLiveMode: (mode: boolean) => void;
  toggleLive: (sessionId: string) => void;
}

const UIStateContext = createContext<UIStateContextValue | null>(null);

export function useUIState() {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
}

interface ActionsContextValue {
  handleSaveEvent: (updatedEvent: Event) => void;
  handleDeleteEvent: (eventId: string) => void;
  handleSaveSession: (updatedSession: Session) => void;
  handleDeleteSession: (sessionId: string) => void;
  handleReorderSessions: (reordered: Session[]) => void;
  handleQuickAddSession: (title: string, duration: number) => void;
}

const ActionsContext = createContext<ActionsContextValue | null>(null);

export function useActions() {
  const context = useContext(ActionsContext);
  if (!context) {
    throw new Error('useActions must be used within an ActionsProvider');
  }
  return context;
}

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

  // Events subscription - runs immediately on mount
  useEffect(() => {
    const unsubEvents = subscribeToEvents((eventsFromFirestore) => {
      setEvents(eventsFromFirestore);
      if (!selectedEventId && eventsFromFirestore.length > 0) {
        const defaultId = getDefaultEventId(eventsFromFirestore);
        if (defaultId) setSelectedEventId(defaultId);
      }
    });
    subscriptionsRef.current.push(unsubEvents);
    return () => {
      unsubEvents();
    };
  }, []);

  // Sessions subscription - subscribes when event selected
  useEffect(() => {
    if (!selectedEventId) return;
    const unsubSessions = subscribeToSessions(selectedEventId, (sessionsFromFirestore) => {
      setSessions(sessionsFromFirestore);
    });
    subscriptionsRef.current.push(unsubSessions);
    return () => {
      unsubSessions();
    };
  }, [selectedEventId]);

  // Performers subscription - subscribes when event selected
  useEffect(() => {
    if (!selectedEventId) return;
    const unsubPerformers = subscribeToPerformersByEvent(selectedEventId, (performersFromFirestore) => {
      setPerformers(performersFromFirestore);
    });
    subscriptionsRef.current.push(unsubPerformers);
    return () => {
      unsubPerformers();
    };
  }, [selectedEventId]);

  const sessionsRef = useRef<Session[]>(sessions);
  sessionsRef.current = sessions;

  const eventsRef = useRef<Event[]>(events);
  eventsRef.current = events;

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

  const toggleLive = useCallback((sessionId: string) => {
    setIsAutoLiveMode(false);
    const targetSession = sessionsRef.current.find((s) => s.id === sessionId);
    if (targetSession) {
      const updated = { ...targetSession, isLive: !targetSession.isLive };
      updateSession(sessionId, updated).catch(console.error);
    }
  }, []);

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
  }, [invalidateAdaptiveScheduleCache, markEventPending, createEvent, updateEvent]);

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
  }, [selectedEventId, events, invalidateAdaptiveScheduleCache, deleteEvent]);

  const handleSaveSession = useCallback(async (updatedSession: Session) => {
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
  }, [selectedSessionId, invalidateAdaptiveScheduleCache, markSessionPending, createSession, updateSession]);

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
  }, [markSessionPending, invalidateAdaptiveScheduleCache, reorderSessions]);

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
  }, [selectedEventId, invalidateAdaptiveScheduleCache, markSessionPending, createSlug]);

  const dataValue = useMemo<DataContextValue>(() => ({
    events,
    sessions,
    performers,
  }), [events, sessions, performers]);

  const selectionValue = useMemo<SelectionContextValue>(() => ({
    selectedEventId,
    setSelectedEventId,
    selectedSessionId,
    setSelectedSessionId,
    navigateToSession: (id: string) => {
      setSelectedSessionId(id);
    },
    navigateToEditSession: (id: string) => {
      setSelectedSessionId(id);
    },
    navigateToAddSession: (eventId: string) => {
      // Will be overridden by App.tsx or ViewProvider
    },
    navigateToEditEvent: (id: string) => {
      setSelectedEventId(id);
    },
    handleEventSelect: (id: string) => {
      setSelectedEventId(id);
    },
  }), [selectedEventId, setSelectedEventId, selectedSessionId, setSelectedSessionId]);

  const uiStateValue = useMemo<UIStateContextValue>(() => ({
    isAutoLiveMode,
    setIsAutoLiveMode,
    toggleLive,
  }), [isAutoLiveMode, toggleLive]);

  const actionsValue = useMemo<ActionsContextValue>(() => ({
    handleSaveEvent,
    handleDeleteEvent,
    handleSaveSession,
    handleDeleteSession,
    handleReorderSessions,
    handleQuickAddSession,
  }), [handleSaveEvent, handleDeleteEvent, handleSaveSession, handleDeleteSession, handleReorderSessions, handleQuickAddSession]);

  return (
    <DataContext.Provider value={dataValue}>
      <SelectionContext.Provider value={selectionValue}>
        <UIStateContext.Provider value={uiStateValue}>
          <ActionsContext.Provider value={actionsValue}>
            {children}
          </ActionsContext.Provider>
        </UIStateContext.Provider>
      </SelectionContext.Provider>
    </DataContext.Provider>
  );
}
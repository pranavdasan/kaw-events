/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Session, Event, Participant } from "./types";
import { useAdaptiveSchedule, invalidateAdaptiveScheduleCache } from "./hooks/useAdaptiveSchedule";
import { ONAM_POOKALAM_BASE64, createSlug } from "./utils/imageUtils";
import { onAuthStateChanged, signOut, User, getIdTokenResult } from "firebase/auth";
import { auth } from "./firebase";
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
  publishPendingChanges as firestorePublishPendingChanges,
  getBookmarks,
  addBookmark,
  removeBookmark,
} from "./services/firestore";

// Import Components
import { Layout } from "./components/common/Layout";
import { AdminLoginView } from "./components/admin/AdminLoginView";
import { EventsListView } from "./components/events/EventsListView";
import { EventHeader } from "./components/events/EventHeader";
import { EventScheduleView } from "./components/schedule/EventScheduleView";
import { SessionDetailView } from "./components/schedule/SessionDetailView";
import { BookmarksListView } from "./components/schedule/BookmarksListView";
import { ShareModal } from "./components/common/ShareModal";
import { AdminDashboardView } from "./components/admin/AdminDashboardView";
import { AdminEditView } from "./components/admin/AdminEditView";
import { EventEditView } from "./components/admin/EventEditView";

/**
 * Main Application Component
 * Manages global state using Firestore real-time listeners.
 * Data syncs across devices and persists to backend.
 */
export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<
    | "events"
    | "schedule"
    | "bookmarks"
    | "admin-dashboard"
    | "session-details"
    | "admin-edit"
    | "admin-event-edit"
    | "admin-login"
  >("events");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Firestore data state
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [performers, setPerformers] = useState<Participant[]>([]);
  const [isAutoLiveMode, setIsAutoLiveMode] = useState<boolean>(true);

  // Pending changes for "Update Event" feature
  const [pendingEvents, setPendingEvents] = useState<Map<string, Event>>(new Map());
  const [pendingSessions, setPendingSessions] = useState<Map<string, Session>>(new Map());
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Store original state for revert functionality
  const [originalEvents, setOriginalEvents] = useState<Event[] | null>(null);
  const [originalSessions, setOriginalSessions] = useState<Session[] | null>(null);

  // Bookmarks & Share State
  const [bookmarkedSessionIds, setBookmarkedSessionIds] = useState<string[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    session?: Session;
    eventName?: string;
  }>({ isOpen: false });

  // Track subscriptions for cleanup
  const subscriptionsRef = useRef<Array<() => void>>([]);

  // --- Auth State Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthLoading(false);

      if (user) {
        // Check custom claims for admin status
        try {
          const tokenResult = await getIdTokenResult(user, true);
          setIsAdmin(tokenResult.claims.admin === true);
        } catch {
          setIsAdmin(false);
        }

        // Load user bookmarks
        try {
          const bookmarks = await getBookmarks(user.uid);
          setBookmarkedSessionIds(bookmarks);
        } catch (err) {
          console.error("Failed to load bookmarks:", err);
        } finally {
          setBookmarksLoading(false);
        }
      } else {
        setIsAdmin(false);
        setBookmarkedSessionIds([]);
        setBookmarksLoading(false);
      }
    });

    return () => {
      unsubscribe();
      // Cleanup all Firestore subscriptions
      subscriptionsRef.current.forEach((unsub) => unsub());
      subscriptionsRef.current = [];
    };
  }, []);

  // --- Firestore Subscriptions ---
  useEffect(() => {
    // Subscribe to events
    const unsubEvents = subscribeToEvents((firestoreEvents) => {
      setEvents(firestoreEvents);
      // Auto-select first event if none selected
      if (!selectedEventId && firestoreEvents.length > 0) {
        setSelectedEventId(firestoreEvents[0].id);
      }
    });
    subscriptionsRef.current.push(unsubEvents);

    // Subscribe to sessions for selected event
    let unsubSessions: (() => void) | null = null;
    if (selectedEventId) {
      unsubSessions = subscribeToSessions(selectedEventId, (firestoreSessions) => {
        setSessions(firestoreSessions);
      });
      subscriptionsRef.current.push(unsubSessions);
    }

    return () => {
      if (unsubSessions) unsubSessions();
    };
  }, [selectedEventId]);

  // Subscribe to performers for selected event
  useEffect(() => {
    let unsubPerformers: (() => void) | null = null;
    if (selectedEventId) {
      unsubPerformers = subscribeToPerformersByEvent(selectedEventId, (firestorePerformers) => {
        setPerformers(firestorePerformers);
      });
      subscriptionsRef.current.push(unsubPerformers);
    }
    return () => {
      if (unsubPerformers) unsubPerformers();
    };
  }, [selectedEventId]);

  // --- Pending Changes Helpers ---
  const markEventPending = (event: Event) => {
    if (pendingEvents.size === 0 && pendingSessions.size === 0) {
      setOriginalEvents(events);
      setOriginalSessions(sessions);
    }
    setPendingEvents((prev) => new Map(prev).set(event.id, event));
    setHasPendingChanges(true);
  };

  const markSessionPending = (session: Session) => {
    if (pendingEvents.size === 0 && pendingSessions.size === 0) {
      setOriginalEvents(events);
      setOriginalSessions(sessions);
    }
    setPendingSessions((prev) => new Map(prev).set(session.id, session));
    setHasPendingChanges(true);
  };

  const clearPendingChanges = () => {
    if (originalEvents) setEvents(originalEvents);
    if (originalSessions) setSessions(originalSessions);
    setPendingEvents(new Map());
    setPendingSessions(new Map());
    setHasPendingChanges(false);
    setOriginalEvents(null);
    setOriginalSessions(null);
  };

  const publishPendingChanges = async () => {
    try {
      await firestorePublishPendingChanges(
        Array.from(pendingEvents.values()),
        Array.from(pendingSessions.values())
      );
      clearPendingChanges();
    } catch (err) {
      console.error("Failed to publish changes:", err);
      alert("Failed to publish changes. Please try again.");
    }
  };

  // --- Navigation Handlers ---
  const navigateToSession = (id: string) => {
    const sessionObj = sessions.find((s) => s.id === id);
    if (sessionObj) {
      setSelectedSessionId(id);
      if (!selectedEventId) {
        setSelectedEventId(sessionObj.eventId);
      }
      setCurrentView("session-details");
    }
  };

  const navigateToEditSession = (id: string) => {
    setSelectedSessionId(id);
    setCurrentView("admin-edit");
  };

  const navigateToAddSession = (eventId: string) => {
    const tempId = `s-${Date.now()}`;
    const newSession: Session = {
      id: tempId,
      eventId,
      title: "",
      description: "",
      durationInMin: 15,
      track: "General",
      room: "Main Hall",
      participants: [],
      isLive: false,
      type: "session",
      order: 0,
      isPending: true,
    };
    setSelectedSessionId(tempId);
    setCurrentView("admin-edit");
    setSessions((prev) => [...prev, newSession]);
  };

  const navigateToEditEvent = (id: string) => {
    setSelectedEventId(id);
    setCurrentView("admin-event-edit");
  };

  const handleEventSelect = (id: string) => {
    setSelectedEventId(id);
    setCurrentView("schedule");
  };

  // --- Data Mutation Handlers (Firestore) ---
  const toggleLive = (sessionId: string) => {
    setIsAutoLiveMode(false);
    const targetSession = sessions.find((s) => s.id === sessionId);
    if (targetSession) {
      const updated = { ...targetSession, isLive: !targetSession.isLive };
      updateSession(sessionId, updated).catch(console.error);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
    }
  };

  const handleResetAutoLive = () => {
    setIsAutoLiveMode(true);
  };

  const handleSaveSession = async (updatedSession: Session) => {
    console.log("handleSaveSession received:", updatedSession);
    
    if (updatedSession.isPending || updatedSession.id.startsWith("s-")) {
      // New session - create in Firestore
      const { isPending, ...sessionData } = updatedSession;
      try {
        const newId = await createSession(sessionData);
        setSessions((prev) =>
          prev.map((s) => (s.id === updatedSession.id ? { ...sessionData, id: newId } : s))
        );
        if (selectedSessionId === updatedSession.id) {
          setSelectedSessionId(newId);
        }
      } catch (err) {
        console.error("Failed to create session:", err);
        alert("Failed to save session. Please try again.");
        return;
      }
    } else {
      // Existing session - update in Firestore
      try {
        await updateSession(updatedSession.id, updatedSession);
        setSessions((prev) =>
          prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
        );
      } catch (err) {
        console.error("Failed to update session:", err);
        alert("Failed to save session. Please try again.");
        return;
      }
    }
    invalidateAdaptiveScheduleCache(updatedSession.eventId);
    markSessionPending(updatedSession.isPending ? { ...updatedSession, isPending: false } : updatedSession);
    setCurrentView("admin-dashboard");
  };

  const handleSaveEvent = async (updatedEvent: Event) => {
    try {
      if (updatedEvent.id.startsWith("e-")) {
        // New event
        const { id, ...eventData } = updatedEvent;
        const newId = await createEvent(eventData);
        setEvents((prev) => [...prev, { ...eventData, id: newId }]);
        setSelectedEventId(newId);
      } else {
        // Existing event
        await updateEvent(updatedEvent.id, updatedEvent);
        setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
      }
      invalidateAdaptiveScheduleCache(updatedEvent.id);
      markEventPending(updatedEvent);
      setCurrentView("admin-dashboard");
    } catch (err) {
      console.error("Failed to save event:", err);
      alert("Failed to save event. Please try again.");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setSessions((prev) => prev.filter((s) => s.eventId !== eventId));
      if (selectedEventId === eventId) {
        setSelectedEventId(events.find((e) => e.id !== eventId)?.id || null);
      }
      invalidateAdaptiveScheduleCache(eventId);
      setCurrentView("admin-dashboard");
    } catch (err) {
      console.error("Failed to delete event:", err);
      alert("Failed to delete event. Please try again.");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const sessionToDelete = sessions.find((s) => s.id === sessionId);
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (sessionToDelete) {
        invalidateAdaptiveScheduleCache(sessionToDelete.eventId);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
      alert("Failed to delete session. Please try again.");
    }
  };

  const handleReorderSessions = async (reordered: Session[]) => {
    // Update local state immediately for responsiveness
    setSessions((prev) => {
      const otherSessions = prev.filter(
        (s) => !reordered.some((r) => r.id === s.id),
      );
      return [...otherSessions, ...reordered];
    });
    // Persist to Firestore
    try {
      await reorderSessions(reordered);
    } catch (err) {
      console.error("Failed to reorder sessions:", err);
    }
    // Mark all reordered sessions as pending
    reordered.forEach((s) => markSessionPending(s));
    // Invalidate cache for the affected event
    if (reordered.length > 0) {
      invalidateAdaptiveScheduleCache(reordered[0].eventId);
    }
  };

  const handleQuickAddSession = (title: string, duration: number) => {
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

    setSessions((prev) => [...prev, newSession]);
    invalidateAdaptiveScheduleCache(selectedEventId);
    markSessionPending(newSession);
  };

  const addEvent = () => {
    const defaultName = "KAW Cultural Gathering";
    const newEvent: Event = {
      id: createSlug(defaultName),
      name: defaultName,
      description: "A newly created event for KAW Events.",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "17:00",
      imageUrl: ONAM_POOKALAM_BASE64,
    };
    setEvents((prev) => [...prev, newEvent]);
    setSelectedEventId(newEvent.id);
    setCurrentView("admin-event-edit");
  };

  // --- Bookmark Handlers (Firestore) ---
  const toggleBookmark = useCallback(async (sessionId: string) => {
    if (!authUser) return;
    
    setBookmarkedSessionIds((prevBookmarks) => {
      const isBookmarked = prevBookmarks.includes(sessionId);
      const newBookmarks = isBookmarked
        ? prevBookmarks.filter((id) => id !== sessionId)
        : [...prevBookmarks, sessionId];
      
      // Fire and forget Firestore update
      sessions.find((s) => s.id === sessionId)?.eventId && (async () => {
        try {
          if (isBookmarked) {
            await removeBookmark(authUser.uid, sessionId);
          } else {
            await addBookmark(authUser.uid, sessionId, sessions.find((s) => s.id === sessionId)!.eventId);
          }
        } catch (err) {
          console.error("Failed to update bookmark:", err);
          setBookmarkedSessionIds(prevBookmarks);
        }
      })();
      
      return newBookmarks;
    });
  }, [authUser]);

  const handleOpenShare = (session: Session, eventName?: string) => {
    const parentEvent = eventName
      ? null
      : events.find((e) => e.id === session.eventId);
    setShareModalData({
      isOpen: true,
      session,
      eventName: eventName || parentEvent?.name || "KAW Events",
    });
  };

  // --- Handle Deep Links ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session");
    if (sessionId) {
      const sessionObj = sessions.find((s) => s.id === sessionId);
      if (sessionObj) {
        navigateToSession(sessionId);
      }
    }
  }, [sessions]);

  // --- Memos & Derived State ---
  const currentEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId),
    [events, selectedEventId],
  );

  const currentSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId),
    [sessions, selectedSessionId],
  );

  const eventDaySessions = useMemo(() => {
    if (!currentEvent || !currentSession) return [];
    return sessions.filter((s) => s.eventId === currentEvent.id);
  }, [currentEvent, currentSession, sessions]);

  const dayStartTime = currentEvent?.startTime || "09:00";
  const adaptiveSessions = useAdaptiveSchedule(
    eventDaySessions,
    dayStartTime,
    isAutoLiveMode,
    currentEvent?.id || 'default',
  );

  const sessionWithTiming = useMemo(
    () => adaptiveSessions.find((s) => s.id === selectedSessionId),
    [adaptiveSessions, selectedSessionId],
  );

  const currentTitle = useMemo(() => {
    switch (currentView) {
      case "events":
        return "All Events";
      case "schedule":
        return currentEvent?.name || "Schedule";
      case "bookmarks":
        return "Saved Agenda";
      case "admin-dashboard":
        return "Admin Panel";
      case "session-details":
        return "Details";
      case "admin-edit":
        return "Edit Session";
      case "admin-event-edit":
        return "Edit Event";
      case "admin-login":
        return "Admin Sign In";
      default:
        return "KAW Events";
    }
  }, [currentView, currentEvent]);

  if (authLoading || bookmarksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <Layout
        activeTab={
          currentView === "admin-dashboard" ||
          currentView === "admin-edit" ||
          currentView === "admin-login"
            ? "admin-dashboard"
            : currentView
        }
        onTabChange={(tab) => {
          if (tab === "admin-dashboard" && !isAdmin) {
            setCurrentView("admin-login");
          } else {
            setCurrentView(tab as any);
          }
        }}
        title={currentTitle}
        isAdmin={isAdmin}
        bookmarkedCount={bookmarkedSessionIds.length}
        onLogout={async () => {
          await signOut(auth);
          setIsAdmin(false);
          setCurrentView("events");
        }}
        events={events}
        selectedAdminEventId={selectedEventId || events[0]?.id}
        onSelectAdminEvent={(eventId) => {
          setSelectedEventId(eventId);
          setCurrentView("admin-dashboard");
        }}
        onAddEvent={() => {
          addEvent();
          setCurrentView("admin-dashboard");
        }}
      >
        <AnimatePresence mode="wait">
          {currentView === "admin-login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminLoginView
                onLogin={(user) => {
                  setIsAdmin(true);
                  setCurrentView("admin-dashboard");
                }}
              />
            </motion.div>
          )}

          {currentView === "events" && (
            <motion.div
              key="events"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EventsListView
                events={events}
                onSelect={handleEventSelect}
                onAdminClick={() => setCurrentView("admin-login")}
              />
            </motion.div>
          )}

          {currentView === "schedule" && currentEvent && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EventHeader
                event={currentEvent}
                onBack={() => setCurrentView("events")}
              />
              <EventScheduleView
                event={currentEvent}
                sessions={sessions.filter((s) => s.eventId === currentEvent.id)}
                isAutoLiveMode={isAutoLiveMode}
                bookmarkedSessionIds={bookmarkedSessionIds}
                onToggleBookmark={toggleBookmark}
                onShareSession={handleOpenShare}
                onSessionClick={navigateToSession}
              />
            </motion.div>
          )}

          {currentView === "bookmarks" && (
            <motion.div
              key="bookmarks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BookmarksListView
                bookmarkedSessionIds={bookmarkedSessionIds}
                sessions={sessions}
                events={events}
                onToggleBookmark={toggleBookmark}
                onSessionClick={navigateToSession}
                onShareSession={handleOpenShare}
                onExploreEvents={() => setCurrentView("events")}
              />
            </motion.div>
          )}

          {currentView === "session-details" && sessionWithTiming && (
            <motion.div
              key="details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SessionDetailView
                session={sessionWithTiming}
                eventName={currentEvent?.name}
                isBookmarked={bookmarkedSessionIds.includes(sessionWithTiming.id)}
                onToggleBookmark={toggleBookmark}
                onShareSession={handleOpenShare}
                onBack={() => setCurrentView("schedule")}
              />
            </motion.div>
          )}

          {currentView === "admin-dashboard" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminDashboardView
                events={events}
                sessions={sessions}
                selectedEventId={selectedEventId || events[0]?.id}
                onSelectEvent={(id) => setSelectedEventId(id)}
                isAutoLiveMode={isAutoLiveMode}
                onResetAutoLive={handleResetAutoLive}
                onToggleLive={toggleLive}
                onEditSession={navigateToEditSession}
                onAddEvent={addEvent}
                onAddSession={navigateToAddSession}
                onEditEvent={navigateToEditEvent}
                onDeleteEvent={handleDeleteEvent}
                onDeleteSession={handleDeleteSession}
                onReorderSessions={handleReorderSessions}
                onQuickAdd={handleQuickAddSession}
                hasPendingChanges={hasPendingChanges}
                onPublishChanges={publishPendingChanges}
                onDiscardChanges={clearPendingChanges}
              />
            </motion.div>
          )}

          {currentView === "admin-edit" && currentSession && (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminEditView
                session={currentSession}
                allParticipants={performers}
                allSessions={sessions}
                onBack={() => setCurrentView("admin-dashboard")}
                onSave={handleSaveSession}
                onCreateParticipant={async (p) => {
                  const newId = await createPerformer(p);
                  setPerformers((prev) => [...prev, { ...p, id: newId }]);
                }}
              />
            </motion.div>
          )}

          {currentView === "admin-event-edit" && (
            <motion.div
              key="event-edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EventEditView
                event={currentEvent || null}
                onBack={() => setCurrentView("admin-dashboard")}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Layout>

      {/* Global Mobile Share Popup Modal */}
      {shareModalData.session && (
        <ShareModal
          isOpen={shareModalData.isOpen}
          onClose={() => setShareModalData({ isOpen: false })}
          title={shareModalData.session.title}
          subtitle={`${shareModalData.eventName} • ${shareModalData.session.track} Track`}
          url={window.location.origin + "?session=" + shareModalData.session.id}
        />
      )}
    </>
  );
}
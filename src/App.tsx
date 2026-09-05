/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Session, Event, Participant } from "./types";
import { useAdaptiveSchedule, invalidateAdaptiveScheduleCache } from "./hooks/useAdaptiveSchedule";
import { ONAM_POOKALAM_BASE64, createSlug } from "./utils/imageUtils";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import {
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

// Import Providers
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import { DataProvider, useData } from "./providers/DataProvider";
import { PendingChangesProvider, usePendingChanges } from "./providers/PendingChangesProvider";
import { ViewProvider, useView } from "./providers/ViewProvider";

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
 * Inner App Component - uses providers via hooks
 */
function AppInner() {
  const { authUser, isAdmin, authLoading, signOut: handleSignOut } = useAuth();
  const { 
    events, 
    sessions, 
    performers, 
    selectedEventId, 
    setSelectedEventId, 
    isAutoLiveMode, 
    setIsAutoLiveMode 
  } = useData();
  const { 
    currentView, 
    setCurrentView, 
    selectedSessionId, 
    setSelectedSessionId,
    navigateToSession,
    navigateToEditSession,
    navigateToAddSession,
    navigateToEditEvent,
    handleEventSelect,
    initializeFromUrl
  } = useView();
  const {
    pendingEvents,
    pendingSessions,
    hasPendingChanges,
    originalEvents,
    originalSessions,
    markEventPending,
    markSessionPending,
    clearPendingChanges,
    publishPendingChanges,
  } = usePendingChanges();

  const [bookmarkedSessionIds, setBookmarkedSessionIds] = useState<string[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    session?: Session;
    eventName?: string;
    url?: string;
  }>({ isOpen: false });

  // Load user bookmarks when auth changes
  useEffect(() => {
    if (authUser) {
      getBookmarks(authUser.uid).then((bookmarks) => {
        setBookmarkedSessionIds(bookmarks);
      }).catch((err) => {
        console.error("Failed to load bookmarks:", err);
      }).finally(() => {
        setBookmarksLoading(false);
      });
    } else {
      setBookmarkedSessionIds([]);
      setBookmarksLoading(false);
    }
  }, [authUser]);

  // Initialize from URL on mount
  useEffect(() => {
    initializeFromUrl();
  }, [initializeFromUrl]);

  // Handle sessionId from URL after sessions are loaded
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session');
    
    if (sessionId) {
      const sessionObj = sessions.find(s => s.id === sessionId);
      if (sessionObj) {
        navigateToSession(sessionId);
      } else {
        // Session not found in current event's sessions -> fallback to schedule
        setCurrentView('schedule');
      }
    }
  }, [sessions, navigateToSession, setCurrentView]);

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
  }, [authUser, sessions]);

  const handleOpenShare = (session: Session, eventName?: string) => {
    const shareUrl = `${window.location.origin}?event=${session.eventId}&session=${session.id}`;
    const parentEvent = eventName
      ? null
      : events.find((e) => e.id === session.eventId);
    setShareModalData({
      isOpen: true,
      session,
      eventName: eventName || parentEvent?.name || "KAW Events",
      url: shareUrl
    });
  };

  const {
    toggleLive,
    handleSaveEvent,
    handleDeleteEvent,
    handleSaveSession,
    handleDeleteSession,
    handleReorderSessions,
    handleQuickAddSession,
  } = useData();

  const handleResetAutoLive = useCallback(() => {
    setIsAutoLiveMode(true);
  }, []);

  const addEvent = useCallback(() => {
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
    // Event will be added via real-time subscription
    setSelectedEventId(newEvent.id);
    setCurrentView("admin-event-edit");
  }, []);

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
          await handleSignOut();
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
                  // Performer will be added via real-time subscription
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
          url={shareModalData.url}
        />
      )}
    </>
  );
}

/**
 * Main Application Component
 * Uses provider pattern for state management
 */
export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <PendingChangesProvider>
          <ViewProvider>
            <AppInner />
          </ViewProvider>
        </PendingChangesProvider>
      </DataProvider>
    </AuthProvider>
  );
}
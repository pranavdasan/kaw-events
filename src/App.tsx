/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Session, Event, Participant } from './types';
import { SESSIONS as INITIAL_SESSIONS, EVENTS as INITIAL_EVENTS, PARTICIPANTS as INITIAL_PARTICIPANTS } from './data';
import { useAdaptiveSchedule } from './hooks/useAdaptiveSchedule';
import { ONAM_POOKALAM_BASE64, createSlug } from './utils/imageUtils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../firebase';

// Import Components
import { Layout } from './components/common/Layout';
import { AdminLoginView } from './components/admin/AdminLoginView';
import { EventsListView } from './components/events/EventsListView';
import { EventHeader } from './components/events/EventHeader';
import { EventScheduleView } from './components/schedule/EventScheduleView';
import { SessionDetailView } from './components/schedule/SessionDetailView';
import { BookmarksListView } from './components/schedule/BookmarksListView';
import { ShareModal } from './components/common/ShareModal';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { AdminEditView } from './components/admin/AdminEditView';
import { EventEditView } from './components/admin/EventEditView';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Main Application Component
 * Manages global state using local React state with Firebase Auth for admin.
 * Data persists in localStorage for bookmarks only.
 */
export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<'events' | 'schedule' | 'bookmarks' | 'admin-dashboard' | 'session-details' | 'admin-edit' | 'admin-event-edit' | 'admin-login'>('events');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const allowedUids = import.meta.env.VITE_ADMIN_UIDS?.split(',').map((u: string) => u.trim()) || [];
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      const isAllowed = user && (allowedUids.length === 0 || allowedUids.includes(user.uid));
      setIsAdmin(!!isAllowed);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Initialize from localStorage if available, otherwise use initial data
  const [events, setEvents] = useState<Event[]>(() => {
    try {
      const stored = localStorage.getItem('kaw-events');
      return stored ? JSON.parse(stored) : INITIAL_EVENTS;
    } catch {
      return INITIAL_EVENTS;
    }
  });
  
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const stored = localStorage.getItem('kaw-sessions');
      return stored ? JSON.parse(stored) : INITIAL_SESSIONS;
    } catch {
      return INITIAL_SESSIONS;
    }
  });
  
  const [performers, setPerformers] = useState<Participant[]>(() => {
    try {
      const stored = localStorage.getItem('kaw-participants');
      return stored ? JSON.parse(stored) : INITIAL_PARTICIPANTS;
    } catch {
      return INITIAL_PARTICIPANTS;
    }
  });
  
  const [isAutoLiveMode, setIsAutoLiveMode] = useState<boolean>(true);

  // Track pending changes for "Update Event" feature
  const [pendingEvents, setPendingEvents] = useState<Map<string, Event>>(new Map());
  const [pendingSessions, setPendingSessions] = useState<Map<string, Session>>(new Map());
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Store original state for revert functionality - initialized from initial data
  const [originalEvents, setOriginalEvents] = useState<Event[] | null>(INITIAL_EVENTS);
  const [originalSessions, setOriginalSessions] = useState<Session[] | null>(INITIAL_SESSIONS);

  const markEventPending = (event: Event) => {
    // Store original state on first pending change
    if (pendingEvents.size === 0 && pendingSessions.size === 0) {
      setOriginalEvents(events);
      setOriginalSessions(sessions);
    }
    setPendingEvents(prev => new Map(prev).set(event.id, event));
    setHasPendingChanges(true);
  };

  const markSessionPending = (session: Session) => {
    // Store original state on first pending change
    if (pendingEvents.size === 0 && pendingSessions.size === 0) {
      setOriginalEvents(events);
      setOriginalSessions(sessions);
    }
    setPendingSessions(prev => new Map(prev).set(session.id, session));
    setHasPendingChanges(true);
  };

  const clearPendingChanges = () => {
    // Restore original state
    if (originalEvents) setEvents(originalEvents);
    if (originalSessions) setSessions(originalSessions);
    setPendingEvents(new Map());
    setPendingSessions(new Map());
    setHasPendingChanges(false);
    setOriginalEvents(null);
    setOriginalSessions(null);
  };

  const publishPendingChanges = () => {
    if (pendingEvents.size > 0) {
      setEvents(prev => {
        const updated = [...prev];
        pendingEvents.forEach(event => {
          const idx = updated.findIndex(e => e.id === event.id);
          if (idx >= 0) updated[idx] = event;
          else updated.push(event);
        });
        return updated;
      });
    }
    if (pendingSessions.size > 0) {
      setSessions(prev => {
        const updated = [...prev];
        pendingSessions.forEach(session => {
          const idx = updated.findIndex(s => s.id === session.id);
          if (idx >= 0) updated[idx] = session;
          else updated.push(session);
        });
        return updated;
      });
    }
    clearPendingChanges();
  };

  // Persist events, sessions, performers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kaw-events', JSON.stringify(events));
    } catch (err) {
      console.error('Failed to save events', err);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem('kaw-sessions', JSON.stringify(sessions));
    } catch (err) {
      console.error('Failed to save sessions', err);
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem('kaw-participants', JSON.stringify(performers));
    } catch (err) {
      console.error('Failed to save participants', err);
    }
  }, [performers]);

  // --- Bookmarks & Share State ---
  const [bookmarkedSessionIds, setBookmarkedSessionIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bookmarkedSessions') || '[]');
    } catch {
      return ['s2', 's3']; // Default demo bookmarks
    }
  });

  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    session?: Session;
    eventName?: string;
  }>({ isOpen: false });

  // Save bookmarks to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('bookmarkedSessions', JSON.stringify(bookmarkedSessionIds));
    } catch (err) {
      console.error('Failed to save bookmarks', err);
    }
  }, [bookmarkedSessionIds]);

  const toggleBookmark = (sessionId: string) => {
    setBookmarkedSessionIds(prev => 
      prev.includes(sessionId) ? prev.filter(id => id !== sessionId) : [...prev, sessionId]
    );
  };

  const handleOpenShare = (session: Session, eventName?: string) => {
    const parentEvent = eventName ? null : events.find(e => e.id === session.eventId);
    setShareModalData({
      isOpen: true,
      session,
      eventName: eventName || parentEvent?.name || 'KAW Events'
    });
  };

  // --- Navigation Handlers ---

  const navigateToSession = (id: string) => {
    const sessionObj = sessions.find(s => s.id === id);
    if (sessionObj) {
      setSelectedSessionId(id);
      if (!selectedEventId) {
        setSelectedEventId(sessionObj.eventId);
      }
      setCurrentView('session-details');
    }
  };

  const navigateToEditSession = (id: string) => {
    setSelectedSessionId(id);
    setCurrentView('admin-edit');
  };

  const navigateToAddSession = (eventId: string) => {
    // Navigate to admin-edit with a new session flag, session will be created on save
    const tempId = `s-${Date.now()}`;
    const newSession: Session = {
      id: tempId,
      eventId,
      title: '',
      description: '',
      durationInMin: 15,
      track: 'General',
      room: 'Main Hall',
      participants: [],
      isLive: false,
      type: 'session',
      order: 0
    };
    // Don't add to sessions yet - only add when user saves
    // We pass the temp session to the edit view
    setSelectedSessionId(tempId);
    setCurrentView('admin-edit');
    // Store the temp session in a ref or use a different approach
    // For now, add it but mark it as pending
    setSessions(prev => [...prev, { ...newSession, isPending: true }]);
  };

  const navigateToEditEvent = (id: string) => {
    setSelectedEventId(id);
    setCurrentView('admin-event-edit');
  };

  const handleEventSelect = (id: string) => {
    setSelectedEventId(id);
    setCurrentView('schedule');
  };

  // --- Data Management & Mutation Handlers (localStorage only) ---

  const toggleLive = (sessionId: string) => {
    setIsAutoLiveMode(false);
    const targetSession = sessions.find(s => s.id === sessionId);
    if (targetSession) {
      const updated = { ...targetSession, isLive: !targetSession.isLive };
      setSessions(prev => prev.map(s => s.id === sessionId ? updated : s));
    }
  };

  const handleResetAutoLive = () => {
    setIsAutoLiveMode(true);
  };

  const handleSaveSession = (updatedSession: Session) => {
    console.log('handleSaveSession received:', updatedSession);
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    markSessionPending(updatedSession);
    setCurrentView('admin-dashboard');
  };

  const handleSaveEvent = (updatedEvent: Event) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    markEventPending(updatedEvent);
    setCurrentView('admin-dashboard');
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setSessions(prev => prev.filter(s => s.eventId !== eventId));
    setCurrentView('admin-dashboard');
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleReorderSessions = (reordered: Session[]) => {
    setSessions(prev => {
      const otherSessions = prev.filter(s => !reordered.some(r => r.id === s.id));
      return [...otherSessions, ...reordered];
    });
  };

  /**
   * Fast way to add intermissions or breaks without full form entry.
   */
  const handleQuickAddSession = (title: string, duration: number) => {
    if (!selectedEventId) return;
    
    const eventDaySessions = sessions.filter(s => s.eventId === selectedEventId);
    const maxOrder = eventDaySessions.reduce((max, s) => Math.max(max, s.order ?? 0), -1);

    const newSession: Session = {
      id: createSlug(`${selectedEventId}-${title}`),
      eventId: selectedEventId,
      title,
      description: 'Quick added program item.',
      durationInMin: duration,
      track: 'General',
      room: 'Main Hall',
      participants: [],
      isLive: false,
      type: 'break',
      order: maxOrder + 1
    };

    setSessions(prev => [...prev, newSession]);
    markSessionPending(newSession);
  };

  const addEvent = () => {
    const defaultName = 'KAW Cultural Gathering';
    const newEvent: Event = {
      id: createSlug(defaultName),
      name: defaultName,
      description: 'A newly created event for KAW Events.',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      imageUrl: ONAM_POOKALAM_BASE64,
    };
    setEvents(prev => [...prev, newEvent]);
    setSelectedEventId(newEvent.id);
    setCurrentView('admin-event-edit');
  };

  // --- Memos & Derived State ---

  const currentEvent = useMemo(() => events.find(e => e.id === selectedEventId), [events, selectedEventId]);
  const currentSession = useMemo(() => sessions.find(s => s.id === selectedSessionId), [sessions, selectedSessionId]);
  
  // Calculate adaptive timing for session detail view (requires full list of that event's sessions)
  const eventDaySessions = useMemo(() => {
    if (!currentEvent || !currentSession) return [];
    return sessions.filter(s => s.eventId === currentEvent.id);
  }, [currentEvent, currentSession, sessions]);

  const dayStartTime = currentEvent?.startTime || '09:00';
  const adaptiveSessions = useAdaptiveSchedule(eventDaySessions, dayStartTime, isAutoLiveMode);
  const sessionWithTiming = useMemo(() => 
    adaptiveSessions.find(s => s.id === selectedSessionId),
    [adaptiveSessions, selectedSessionId]
  );

  const currentTitle = useMemo(() => {
    switch (currentView) {
      case 'events': return 'All Events';
      case 'schedule': return currentEvent?.name || 'Schedule';
      case 'bookmarks': return 'Saved Agenda';
      case 'admin-dashboard': return 'Admin Panel';
      case 'session-details': return 'Details';
      case 'admin-edit': return 'Edit Session';
      case 'admin-event-edit': return 'Edit Event';
      case 'admin-login': return 'Admin Sign In';
      default: return "KAW Events";
    }
  }, [currentView, currentEvent]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <Layout 
        activeTab={currentView === 'admin-dashboard' || currentView === 'admin-edit' || currentView === 'admin-login' ? 'admin-dashboard' : currentView} 
        onTabChange={(tab) => {
          if (tab === 'admin-dashboard' && !isAdmin) {
            setCurrentView('admin-login');
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
          setCurrentView('events'); 
        }}
        events={events}
        selectedAdminEventId={selectedEventId || events[0]?.id}
        onSelectAdminEvent={(eventId) => {
          setSelectedEventId(eventId);
          setCurrentView('admin-dashboard');
        }}
        onAddEvent={() => {
          addEvent();
          setCurrentView('admin-dashboard');
        }}
      >
        <AnimatePresence mode="wait">
          {currentView === 'admin-login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminLoginView onLogin={(user) => { setIsAdmin(true); setCurrentView('admin-dashboard'); }} />
            </motion.div>
          )}
          
          {currentView === 'events' && (
            <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EventsListView events={events} onSelect={handleEventSelect} onAdminClick={() => setCurrentView('admin-login')} />
            </motion.div>
          )}

          {currentView === 'schedule' && currentEvent && (
            <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EventHeader event={currentEvent} onBack={() => setCurrentView('events')} />
              <EventScheduleView 
                event={currentEvent} 
                sessions={sessions.filter(s => s.eventId === currentEvent.id)} 
                isAutoLiveMode={isAutoLiveMode}
                bookmarkedSessionIds={bookmarkedSessionIds}
                onToggleBookmark={toggleBookmark}
                onShareSession={handleOpenShare}
                onSessionClick={navigateToSession} 
              />
            </motion.div>
          )}

          {currentView === 'bookmarks' && (
            <motion.div key="bookmarks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BookmarksListView 
                bookmarkedSessionIds={bookmarkedSessionIds}
                sessions={sessions}
                events={events}
                onToggleBookmark={toggleBookmark}
                onSessionClick={navigateToSession}
                onShareSession={handleOpenShare}
                onExploreEvents={() => setCurrentView('events')}
              />
            </motion.div>
          )}

          {currentView === 'session-details' && sessionWithTiming && (
            <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SessionDetailView 
                session={sessionWithTiming}
                eventName={currentEvent?.name}
                isBookmarked={bookmarkedSessionIds.includes(sessionWithTiming.id)}
                onToggleBookmark={toggleBookmark}
                onShareSession={handleOpenShare}
                onBack={() => setCurrentView('schedule')} 
              />
            </motion.div>
          )}

          {currentView === 'admin-dashboard' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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

          {currentView === 'admin-edit' && currentSession && (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminEditView 
                session={currentSession} 
                allParticipants={performers}
                allSessions={sessions}
                onBack={() => setCurrentView('admin-dashboard')} 
                onSave={handleSaveSession}
                onCreateParticipant={(p) => setPerformers(prev => [...prev, p])}
              />
            </motion.div>
          )}

          {currentView === 'admin-event-edit' && (
            <motion.div key="event-edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EventEditView 
                event={currentEvent || null} 
                onBack={() => setCurrentView('admin-dashboard')} 
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
          url={window.location.origin + '?session=' + shareModalData.session.id}
        />
      )}
    </>
  );
}
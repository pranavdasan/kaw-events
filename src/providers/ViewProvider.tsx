import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

type ViewType = 
  | 'events'
  | 'schedule'
  | 'bookmarks'
  | 'admin-dashboard'
  | 'session-details'
  | 'admin-edit'
  | 'admin-event-edit'
  | 'admin-login';

interface ViewContextValue {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;
  navigateToSession: (id: string) => void;
  navigateToEditSession: (id: string) => void;
  navigateToAddSession: (eventId: string) => void;
  navigateToEditEvent: (id: string) => void;
  handleEventSelect: (id: string) => void;
  initializeFromUrl: () => void;
}

const ViewContext = createContext<ViewContextValue | null>(null);

interface ViewProviderProps {
  children: React.ReactNode;
}

export function ViewProvider({ children }: ViewProviderProps) {
  const [currentView, setCurrentView] = useState<ViewType>('events');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const navigateToSession = useCallback((id: string) => {
    setSelectedSessionId(id);
    setCurrentView('session-details');
  }, []);

  const navigateToEditSession = useCallback((id: string) => {
    setSelectedSessionId(id);
    setCurrentView('admin-edit');
  }, []);

  const navigateToAddSession = useCallback((eventId: string) => {
    setCurrentView('admin-edit');
    // Session creation will be handled by the component
  }, []);

  const navigateToEditEvent = useCallback((id: string) => {
    setSelectedEventId(id);
    setCurrentView('admin-event-edit');
  }, []);

  const handleEventSelect = useCallback((id: string) => {
    setSelectedEventId(id);
    setCurrentView('schedule');
  }, []);

  const initializeFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event');
    const sessionId = params.get('session');

    if (eventId) {
      handleEventSelect(eventId);
    }

    if (eventId || sessionId) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [handleEventSelect]);

  const value = {
    currentView,
    setCurrentView,
    selectedEventId,
    setSelectedEventId,
    selectedSessionId,
    setSelectedSessionId,
    navigateToSession,
    navigateToEditSession,
    navigateToAddSession,
    navigateToEditEvent,
    handleEventSelect,
    initializeFromUrl,
  };

  return (
    <ViewContext.Provider value={value}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView(): ViewContextValue {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
}
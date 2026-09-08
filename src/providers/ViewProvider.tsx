import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useSelection } from './DataProvider';

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
  selectedSessionId: string | null;
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
  const { selectedEventId, setSelectedEventId, selectedSessionId, setSelectedSessionId } = useSelection();
  const [currentView, setCurrentView] = useState<ViewType>('events');

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
    selectedSessionId,
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
import React, { createContext, useContext, useCallback } from 'react';

interface ActionsContextValue {
  handleSaveEvent: (updatedEvent: import('../types').Event) => void;
  handleDeleteEvent: (eventId: string) => void;
  handleSaveSession: (updatedSession: import('../types').Session) => void;
  handleDeleteSession: (sessionId: string) => void;
  handleReorderSessions: (reordered: import('../types').Session[]) => void;
  handleQuickAddSession: (title: string, duration: number) => void;
  toggleLive: (sessionId: string) => void;
}

const ActionsContext = createContext<ActionsContextValue | null>(null);

export function useActions() {
  const context = useContext(ActionsContext);
  if (!context) {
    throw new Error('useActions must be used within an ActionsProvider');
  }
  return context;
}

export default ActionsContext;
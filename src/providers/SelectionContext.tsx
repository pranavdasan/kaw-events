import React, { createContext, useContext, useState, useCallback } from 'react';

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

export default SelectionContext;
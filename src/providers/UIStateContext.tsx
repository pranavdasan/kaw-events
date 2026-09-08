import React, { createContext, useContext, useState, useCallback } from 'react';

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

export default UIStateContext;
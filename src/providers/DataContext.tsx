import React, { createContext, useContext } from 'react';

interface DataContextValue {
  events: import('../types').Event[];
  sessions: import('../types').Session[];
  performers: import('../types').Participant[];
}

const DataContext = createContext<DataContextValue | null>(null);

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export default DataContext;
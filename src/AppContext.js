import React, { createContext, useState } from 'react';

export const AppContext = createContext({ rows: [], setRows: () => {} });

export function AppProvider({ children }) {
  const [rows, setRows] = useState([]);
  return (
    <AppContext.Provider value={{ rows, setRows }}>
      {children}
    </AppContext.Provider>
  );
}

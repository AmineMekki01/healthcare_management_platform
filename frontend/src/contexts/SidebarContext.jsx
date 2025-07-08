import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    // Provide fallback values when provider is not available
    return {
      sidebarOpen: true,
      setSidebarOpen: () => {},
      handleSidebarToggle: () => {},
    };
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const value = {
    sidebarOpen,
    setSidebarOpen,
    handleSidebarToggle,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

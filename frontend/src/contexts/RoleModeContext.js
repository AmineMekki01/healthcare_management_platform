import React, { createContext, useContext, useState, useEffect } from 'react';

const RoleModeContext = createContext();

export const useRoleMode = () => {
  const context = useContext(RoleModeContext);
  if (!context) {
    throw new Error('useRoleMode must be used within a RoleModeProvider');
  }
  return context;
};

export const RoleModeProvider = ({ children, userType, userId }) => {
  const [activeMode, setActiveMode] = useState(() => {
    if (!userId || !userType) {
      return 'patient';
    }
    
    const userKey = `activeRoleMode_${userId}`;
    const savedMode = localStorage.getItem(userKey);
    
    if (savedMode && (savedMode === userType || savedMode === 'patient')) {
      return savedMode;
    }
    return userType;
  });

  useEffect(() => {
    if (userId && userType) {
      const userKey = `activeRoleMode_${userId}`;
      const savedMode = localStorage.getItem(userKey);
      
      if (savedMode && (savedMode === userType || savedMode === 'patient')) {
        setActiveMode(savedMode);
      } else {
        setActiveMode(userType);
      }
    } else if (!userId || !userType) {
      setActiveMode('patient');
    }
  }, [userType, userId]);

  useEffect(() => {
    if (userId) {
      const userKey = `activeRoleMode_${userId}`;
      localStorage.setItem(userKey, activeMode);
    }
  }, [activeMode, userId]);
  
  const canSwitchModes = userType === 'receptionist' || userType === 'doctor';
  
  const handleModeToggle = () => {
    if (activeMode === userType) {
      setActiveMode('patient');
    } else {
      setActiveMode(userType);
    }
  };

  const switchToMode = (mode) => {
    if (mode === 'patient' || mode === userType) {
      setActiveMode(mode);
    }
  };

  const clearRoleModeData = () => {
    if (userId) {
      const userKey = `activeRoleMode_${userId}`;
      localStorage.removeItem(userKey);
    }
    setActiveMode(userType || 'patient');
  };

  return (
    <RoleModeContext.Provider
      value={{
        activeMode,
        setActiveMode,
        canSwitchModes,
        handleModeToggle,
        switchToMode,
        clearRoleModeData,
        userType,
      }}
    >
      {children}
    </RoleModeContext.Provider>
  );
};

import React from 'react';
import AuthProvider from './AuthContext';

const NavigationProvider = ({ children }) => {
  

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

export default NavigationProvider;
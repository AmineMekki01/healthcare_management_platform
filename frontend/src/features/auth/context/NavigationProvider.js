import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthProvider from './AuthContext';
import { RoleModeProvider } from '../../../contexts/RoleModeContext';
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

const RoleModeWrapper = ({ children }) => {
  const { userType, userId } = useContext(AuthContext);
  
  return (
    <RoleModeProvider userType={userType} userId={userId}>
      {children}
    </RoleModeProvider>
  );
};

const NavigationProvider = ({ children }) => {
  const navigate = useNavigate();

  return (
    <AuthProvider navigate={navigate}>
      <RoleModeWrapper>
        {children}
      </RoleModeWrapper>
    </AuthProvider>
  );
};

export default NavigationProvider;
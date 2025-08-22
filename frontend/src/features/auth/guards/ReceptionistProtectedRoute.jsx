import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ReceptionistProtectedRoute = ({ children }) => {
  const { isLoggedIn, userType } = useContext(AuthContext);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (userType !== 'receptionist') {
    if (userType === 'doctor') {
      return <Navigate to="/doctor-dashboard" replace />;
    } else if (userType === 'patient') {
      return <Navigate to="/patient-dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ReceptionistProtectedRoute;

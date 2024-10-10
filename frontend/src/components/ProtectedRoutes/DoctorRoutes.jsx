// src/components/ProtectedRoutes/DoctorRoute.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './../Auth/AuthContext';

const DoctorRoute = ({ children }) => {
  const { isLoggedIn, userType } = useContext(AuthContext);

  if (isLoggedIn && userType === 'doctor') {
    return children;
  } else {
    return <Navigate to="/" />;
  }
};

export default DoctorRoute;

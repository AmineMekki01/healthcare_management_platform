import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './../Auth/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isLoggedIn } = useContext(AuthContext);

  if (isLoggedIn) {
    return children;
  } else {
    return <Navigate to="/login" />;
  }
};

export default PrivateRoute;
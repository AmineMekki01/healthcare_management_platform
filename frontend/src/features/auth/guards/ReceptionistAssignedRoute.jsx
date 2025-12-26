import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ReceptionistAssignedRoute = ({ children }) => {
  const { isLoggedIn, userType, assignedDoctorId } = useContext(AuthContext);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (userType !== 'receptionist') {
    return <Navigate to="/" replace />;
  }

  const effectiveAssignedDoctorId = assignedDoctorId || localStorage.getItem('assignedDoctorId');
  if (!effectiveAssignedDoctorId) {
    return <Navigate to="/receptionist/job-offers" replace />;
  }

  return children;
};

export default ReceptionistAssignedRoute;

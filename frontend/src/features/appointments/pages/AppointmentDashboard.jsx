import React, { useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from './../../../features/auth/context/AuthContext';
import { useRoleMode } from '../../../contexts/RoleModeContext';
import { useAppointments } from '../hooks/useAppointments';
import { useAppointmentFilters } from '../hooks/useAppointmentFilters';
import {
  AppointmentStats,
  AppointmentFilter,
  AppointmentTabs,
  AppointmentGrid
} from '../components';
import { Title, Container } from '../styles/appointmentStyles';

const AppointmentDashboard = () => {
  const { userType, userId } = useContext(AuthContext);
  const { activeMode, switchToMode, canSwitchModes } = useRoleMode();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/patient-appointments' && canSwitchModes) {
      switchToMode('patient');
    }
  }, [location.pathname, canSwitchModes, switchToMode]);

  const {
    doctorReservations,
    patientReservations,
    statistics,
    loading,
    error,
    refreshAppointments
  } = useAppointments(userId, userType);

  const {
    filterText,
    activeTab,
    setFilterText,
    setActiveTab,
    currentAppointments,
    filteredAppointments,
    stats,
    tabs,
    tabTitle
  } = useAppointmentFilters(doctorReservations, patientReservations, userType, activeMode);

  if (loading) {
    return (
      <Container>
        <Title>Loading Appointments...</Title>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Title>Error Loading Appointments</Title>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p>{error}</p>
          <button onClick={refreshAppointments}>
            Try Again
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Title>
          {activeMode === 'patient' ? 'My Appointments as Patient' : 
          activeMode === 'doctor' ? 'My Appointments as Doctor' : 
          'My Appointments as Receptionist'}
      </Title>
      
      <AppointmentStats 
        statistics={statistics} 
        userType={userType} 
        activeMode={activeMode}
      />

      <AppointmentFilter
        filterText={filterText}
        onFilterChange={setFilterText}
      />

      <AppointmentTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <AppointmentGrid
        appointments={currentAppointments}
        filteredAppointments={filteredAppointments}
        userType={userType}
        activeMode={activeMode}
        tabTitle={tabTitle}
        activeTab={activeTab}
        onAppointmentUpdate={refreshAppointments}
      />
    </Container>
  );
};

export default AppointmentDashboard;

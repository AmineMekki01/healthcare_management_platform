import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from './../../../features/auth/context/AuthContext';
import { useRoleMode } from '../../../contexts/RoleModeContext';
import { useAppointments } from '../hooks/useAppointments';
import { useAppointmentFilters } from '../hooks/useAppointmentFilters';
import {
  AppointmentStats,
  AppointmentFilter,
  AppointmentTabs,
  AppointmentGrid,
  ViewToggle,
  WeeklyCalendarView
} from '../components';
import { Title, Container } from '../styles/appointmentStyles';

const AppointmentDashboard = () => {
  const { t } = useTranslation(['appointments', 'common']);
  const { userType, userId } = useContext(AuthContext);
  const { activeMode, switchToMode, canSwitchModes } = useRoleMode();
  const location = useLocation();
  const [view, setView] = useState('grid');

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
  } = useAppointments(userId, userType, activeMode);

  const {
    filterText,
    activeTab,
    setFilterText,
    setActiveTab,
    currentAppointments,
    filteredAppointments,
    tabs,
    tabTitle
  } = useAppointmentFilters(doctorReservations, patientReservations, userType, activeMode);

  const allAppointments = useMemo(() => {
    const reservations = activeMode === 'patient' ? patientReservations : doctorReservations;
    return [
      ...(reservations.active || []),
      ...(reservations.passed || []),
      ...(reservations.canceled || [])
    ];
  }, [doctorReservations, patientReservations, activeMode]);

  if (loading) {
    return (
      <Container>
        <Title>{t('appointments:dashboard.loading')}</Title>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Title>{t('appointments:dashboard.error')}</Title>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p>{error}</p>
          <button onClick={refreshAppointments}>
            {t('appointments:dashboard.tryAgain')}
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Title>
          {activeMode === 'patient' ? t('appointments:dashboard.titlePatient') : 
          activeMode === 'doctor' ? t('appointments:dashboard.titleDoctor') : 
          t('appointments:dashboard.titleReceptionist')}
      </Title>
      
      <AppointmentStats 
        statistics={statistics} 
        userType={userType} 
        activeMode={activeMode}
      />

      <ViewToggle 
        view={view} 
        onViewChange={setView} 
      />

      {view === 'grid' ? (
        <>
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
        </>
      ) : (
        <WeeklyCalendarView
          appointments={allAppointments}
          userType={userType}
          userId={userId}
          activeMode={activeMode}
          onAppointmentUpdate={refreshAppointments}
        />
      )}
    </Container>
  );
};

export default AppointmentDashboard;

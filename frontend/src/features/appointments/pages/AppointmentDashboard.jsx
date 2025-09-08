import React, { useContext, useEffect } from 'react';
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
  AppointmentGrid
} from '../components';
import { Title, Container } from '../styles/appointmentStyles';

const AppointmentDashboard = () => {
  const { t } = useTranslation(['appointments', 'common']);
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

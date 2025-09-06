import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useAppointmentFilters = (doctorReservations, patientReservations, userType, activeMode) => {
  const { t } = useTranslation('appointments');
  const [filterText, setFilterText] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');

  const filterReservations = useCallback((reservations) => {
    if (!filterText.trim()) return reservations;

    return reservations.filter(reservation =>
      reservation.doctorFirstName?.toLowerCase().includes(filterText.toLowerCase()) ||
      reservation.doctorLastName?.toLowerCase().includes(filterText.toLowerCase()) ||
      reservation.patientFirstName?.toLowerCase().includes(filterText.toLowerCase()) ||
      reservation.patientLastName?.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [filterText]);

  const getTabAppointments = useCallback(() => {
    let reservations;
    
    console.log('Getting tab appointments:', {
      userType,
      activeMode,
      activeTab,
      doctorReservations,
      patientReservations
    });
    
    if (userType === 'patient' || activeMode === 'patient') {
      reservations = patientReservations;
    } else {
      reservations = doctorReservations;
    }

    switch (activeTab) {
      case 'upcoming':
        return reservations.active || [];
      case 'completed':
        return reservations.passed || [];
      case 'canceled':
        return reservations.canceled || [];
      case 'all':
        return [
          ...(reservations.active || []),
          ...(reservations.passed || []),
          ...(reservations.canceled || [])
        ];
      default:
        return [];
    }
  }, [userType, activeMode, activeTab, doctorReservations, patientReservations]);

  const getCurrentStats = useCallback(() => {
    let reservations;
    
    if (userType === 'patient' || activeMode === 'patient') {
      reservations = patientReservations;
    } else {
      reservations = doctorReservations;
    }

    return {
      upcoming: reservations.active?.length || 0,
      completed: reservations.passed?.length || 0,
      canceled: reservations.canceled?.length || 0,
      total: 
        (reservations.active?.length || 0) + 
        (reservations.passed?.length || 0) + 
        (reservations.canceled?.length || 0)
    };
  }, [userType, activeMode, doctorReservations, patientReservations]);

  const getTabTitle = useCallback(() => {
    const getRoleText = () => {
      if (userType === 'doctor' || userType === 'receptionist') {
        const roleKey = activeMode === 'patient' ? 'patient' : 
                       activeMode === 'doctor' ? 'doctor' : 'receptionist';
        return ` ${t('dashboard.as')} ${t(`userTypes.${roleKey}`)}`;
      }
      return '';
    };
    
    const roleText = getRoleText();
    const baseTitle = t(`dashboard.${activeTab}Appointments`);
    
    return `${baseTitle}${roleText}`;
  }, [activeTab, userType, activeMode, t]);

  const currentAppointments = useMemo(() => getTabAppointments(), [getTabAppointments]);
  const filteredAppointments = useMemo(() => filterReservations(currentAppointments), [filterReservations, currentAppointments]);
  const stats = useMemo(() => getCurrentStats(), [getCurrentStats]);
  const tabTitle = useMemo(() => getTabTitle(), [getTabTitle]);

  const tabs = useMemo(() => [
    { id: 'upcoming', label: t('tabs.upcoming'), count: stats.upcoming },
    { id: 'completed', label: t('tabs.completed'), count: stats.completed },
    { id: 'canceled', label: t('tabs.canceled'), count: stats.canceled },
    { id: 'all', label: t('tabs.all'), count: stats.total }
  ], [stats, t]);

  return {
    filterText,
    activeTab,
    setFilterText,
    setActiveTab,
    currentAppointments,
    filteredAppointments,
    stats,
    tabs,
    tabTitle,
    filterReservations
  };
};

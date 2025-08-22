import { useState, useMemo, useCallback } from 'react';

export const useAppointmentFilters = (doctorReservations, patientReservations, userType, activeMode) => {
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
    const roleText = (userType === 'doctor' || userType === 'receptionist') ? 
      ` as ${activeMode === 'patient' ? 'Patient' : activeMode === 'doctor' ? 'Doctor' : 'Receptionist'}` : '';
    
    switch (activeTab) {
      case 'upcoming':
        return `Upcoming Appointments${roleText}`;
      case 'completed':
        return `Completed Appointments${roleText}`;
      case 'canceled':
        return `Canceled Appointments${roleText}`;
      case 'all':
        return `All Appointments${roleText}`;
      default:
        return `Appointments${roleText}`;
    }
  }, [activeTab, userType, activeMode]);

  const currentAppointments = useMemo(() => getTabAppointments(), [getTabAppointments]);
  const filteredAppointments = useMemo(() => filterReservations(currentAppointments), [filterReservations, currentAppointments]);
  const stats = useMemo(() => getCurrentStats(), [getCurrentStats]);
  const tabTitle = useMemo(() => getTabTitle(), [getTabTitle]);

  const tabs = useMemo(() => [
    { id: 'upcoming', label: 'Upcoming', count: stats.upcoming },
    { id: 'completed', label: 'Completed', count: stats.completed },
    { id: 'canceled', label: 'Canceled', count: stats.canceled },
    { id: 'all', label: 'All', count: stats.total }
  ], [stats]);

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

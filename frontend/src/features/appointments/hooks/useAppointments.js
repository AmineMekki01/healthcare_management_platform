import { useState, useEffect, useCallback, useMemo } from 'react';
import appointmentService from '../services/appointmentService';

export const useAppointments = (userId, userType) => {
  const [doctorReservations, setDoctorReservations] = useState({
    active: [],
    passed: [],
    canceled: []
  });
  const [patientReservations, setPatientReservations] = useState({
    active: [],
    passed: [],
    canceled: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const processReservations = useCallback((data) => {
    const now = new Date();
    
    if (!data || !Array.isArray(data)) {
      setDoctorReservations({
        active: [],
        passed: [],
        canceled: []
      });
      setPatientReservations({
        active: [],
        passed: [],
        canceled: []
      });
      return;
    }
    
    if (userType === 'doctor') {
      const activeDoctorAppts = data.filter(r => 
        !r.isDoctorPatient && !r.canceled && new Date(r.appointmentEnd) > now
      );
      const passedDoctorAppts = data.filter(r => 
        !r.isDoctorPatient && !r.canceled && new Date(r.appointmentEnd) <= now
      );
      const canceledDoctorAppts = data.filter(r => 
        !r.isDoctorPatient && r.canceled
      );

      const activePatientAppts = data.filter(r => 
        r.isDoctorPatient && !r.canceled && new Date(r.appointmentEnd) > now
      );
      const passedPatientAppts = data.filter(r => 
        r.isDoctorPatient && !r.canceled && new Date(r.appointmentEnd) <= now
      );
      const canceledPatientAppts = data.filter(r => 
        r.isDoctorPatient && r.canceled
      );

      setDoctorReservations({
        active: activeDoctorAppts,
        passed: passedDoctorAppts,
        canceled: canceledDoctorAppts
      });
      setPatientReservations({
        active: activePatientAppts,
        passed: passedPatientAppts,
        canceled: canceledPatientAppts
      });
    } else if (userType === 'receptionist') {
      const activePatientAppts = data.filter(r => 
        !r.canceled && new Date(r.appointmentEnd) > now
      );
      const passedPatientAppts = data.filter(r => 
        !r.canceled && new Date(r.appointmentEnd) <= now
      );
      const canceledPatientAppts = data.filter(r => r.canceled);

      setPatientReservations({
        active: activePatientAppts,
        passed: passedPatientAppts,
        canceled: canceledPatientAppts
      });
      
      setDoctorReservations({
        active: [],
        passed: [],
        canceled: []
      });
    } else {
      const activePatientAppts = data.filter(r => 
        !r.canceled && new Date(r.appointmentEnd) > now
      );
      const passedPatientAppts = data.filter(r => 
        !r.canceled && new Date(r.appointmentEnd) <= now
      );
      const canceledPatientAppts = data.filter(r => r.canceled);

      setPatientReservations({
        active: activePatientAppts,
        passed: passedPatientAppts,
        canceled: canceledPatientAppts
      });
    }
  }, [userType]);

  const fetchAppointments = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await appointmentService.fetchReservations(userId, userType);
      console.log('Raw appointment data received:', data);
      processReservations(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [userId, userType, processReservations]);

  const refreshAppointments = useCallback(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);


  const statistics = useMemo(() => {
    if (userType === 'doctor') {
      const totalDoctorAppts = 
        (doctorReservations.active?.length || 0) + 
        (doctorReservations.passed?.length || 0) + 
        (doctorReservations.canceled?.length || 0);
      
      const totalPatientAppts = 
        (patientReservations.active?.length || 0) + 
        (patientReservations.passed?.length || 0) + 
        (patientReservations.canceled?.length || 0);
      
      return {
        totalAsDoctor: totalDoctorAppts,
        totalAsPatient: totalPatientAppts,
        upcomingAsDoctor: doctorReservations.active?.length || 0,
        upcomingAsPatient: patientReservations.active?.length || 0,
        completedAsDoctor: doctorReservations.passed?.length || 0,
        completedAsPatient: patientReservations.passed?.length || 0,
      };
    } else {
      const total = 
        (patientReservations.active?.length || 0) + 
        (patientReservations.passed?.length || 0) + 
        (patientReservations.canceled?.length || 0);
      
      return {
        total,
        upcoming: patientReservations.active?.length || 0,
        completed: patientReservations.passed?.length || 0,
        canceled: patientReservations.canceled?.length || 0,
      };
    }
  }, [doctorReservations, patientReservations, userType]);

  return {
    doctorReservations,
    patientReservations,
    statistics,
    loading,
    error,
    refreshAppointments
  };
};

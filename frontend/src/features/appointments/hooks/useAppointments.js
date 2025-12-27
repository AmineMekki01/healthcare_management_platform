import { useState, useEffect, useCallback, useMemo } from 'react';
import appointmentService from '../services/appointmentService';

export const useAppointments = (userId, userType, activeMode) => {
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
      const asDoctor = data.filter(r => r.doctorId === userId);
      const asPatient = data.filter(r => r.patientId === userId);

      const activeDoctorAppts = asDoctor.filter(r => 
        !r.canceled && new Date(r.appointmentEnd) > now
      );
      const passedDoctorAppts = asDoctor.filter(r => 
        !r.canceled && new Date(r.appointmentEnd) <= now
      );
      const canceledDoctorAppts = asDoctor.filter(r => r.canceled);

      const activePatientAppts = asPatient.filter(r => 
        !r.canceled && new Date(r.appointmentEnd) > now
      );
      const passedPatientAppts = asPatient.filter(r => 
        !r.canceled && new Date(r.appointmentEnd) <= now
      );
      const canceledPatientAppts = asPatient.filter(r => r.canceled);

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
      const activeAppts = data.filter(r => 
        !r.canceled && new Date(r.appointmentEnd) > now
      );
      const passedAppts = data.filter(r => 
        !r.canceled && new Date(r.appointmentEnd) <= now
      );
      const canceledAppts = data.filter(r => r.canceled);

      if (activeMode === 'patient') {
        setPatientReservations({
          active: activeAppts,
          passed: passedAppts,
          canceled: canceledAppts
        });
        
        setDoctorReservations({
          active: [],
          passed: [],
          canceled: []
        });
      } else {
        setDoctorReservations({
          active: activeAppts,
          passed: passedAppts,
          canceled: canceledAppts
        });

        setPatientReservations({
          active: [],
          passed: [],
          canceled: []
        });
      }
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
  }, [userType, userId, activeMode]);

  const fetchAppointments = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      let viewAs;
      if (userType === 'receptionist') {
        viewAs = activeMode === 'patient' ? 'patient' : 'receptionist';
      } else if (userType === 'doctor') {
        viewAs = activeMode === 'patient' ? 'patient' : '';
      }
      const data = await appointmentService.fetchReservations(userId, userType, viewAs);
      console.log('Raw appointment data received:', data);
      processReservations(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [userId, userType, activeMode, processReservations]);

  const refreshAppointments = useCallback(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);


  const statistics = useMemo(() => {
    if (userType === 'doctor' || userType === 'receptionist') {
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
        canceledAsDoctor: doctorReservations.canceled?.length || 0,
        canceledAsPatient: patientReservations.canceled?.length || 0,
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

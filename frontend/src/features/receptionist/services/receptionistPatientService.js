import axios from '../../../components/axiosConfig';

class ReceptionistPatientService {
  async searchPatients(params = {}) {
    const queryParams = new URLSearchParams();
    
    const assignedDoctorId = localStorage.getItem('assignedDoctorId');
    if (assignedDoctorId) {
      queryParams.append('doctor_id', assignedDoctorId);
    }
    
    if (params.search_term) queryParams.append('search_query', params.search_term);
    if (params.status) queryParams.append('status', params.status);
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);
    if (params.page_size) queryParams.append('limit', params.page_size.toString());
    if (params.page && params.page_size) {
      const offset = (params.page - 1) * params.page_size;
      queryParams.append('offset', offset.toString());
    }

    const response = await axios.get(`/api/v1/receptionist/patients/search?${queryParams}`);
    
    return {
      data: {
        patients: response.data.patients || [],
        total: response.data.total_count ?? response.data.totalCount ?? response.data.total ?? 0,
        page: params.page || 1,
        page_size: params.page_size || 20
      }
    };
  }

  async getPatientDetails(patientId) {
    const assignedDoctorId = localStorage.getItem('assignedDoctorId');
    const queryParams = assignedDoctorId ? `?doctor_id=${assignedDoctorId}` : '';
    const response = await axios.get(`/api/v1/receptionist/patients/${patientId}${queryParams}`);
    return response.data;
  }

  async createPatient(patientData) {
    const response = await axios.post('/api/v1/receptionist/patients', patientData);
    return response.data;
  }

  async createAppointment(appointmentData) {
    const assignedDoctorId = localStorage.getItem('assignedDoctorId');
    
    const transformedData = {
      patientId: appointmentData.patient_id || appointmentData.patientId,
      doctorId: assignedDoctorId,
      appointmentStart: appointmentData.appointmentStart,
      appointmentEnd: appointmentData.appointmentEnd,
      appointmentType: appointmentData.appointmentType || 'consultation',
      notes: appointmentData.notes || '',
      title: appointmentData.title || appointmentData.appointmentType || '',
      ...(appointmentData.availabilityId && { availabilityId: appointmentData.availabilityId }),
      ...(appointmentData.date && { date: appointmentData.date }),
      ...(appointmentData.time && { time: appointmentData.time })
    };

    const response = await axios.post('/api/v1/receptionist/appointments', transformedData);
    return response.data;
  }

  async createReservation(appointmentData) {
    const assignedDoctorId = localStorage.getItem('assignedDoctorId');
    
    const reservationData = {
      AppointmentStart: appointmentData.appointmentStart,
      AppointmentEnd: appointmentData.appointmentEnd,
      AppointmentTitle: appointmentData.title || `Appointment with Patient`,
      DoctorID: assignedDoctorId,
      PatientID: appointmentData.patientId || appointmentData.patient_id,
      AvailabilityID: appointmentData.availabilityId,
      Notes: appointmentData.notes
    };

    const response = await axios.post('/api/v1/reservations', reservationData);
    return response.data;
  }

  async getAppointmentStats() {
    const assignedDoctorId = localStorage.getItem('assignedDoctorId');
    if (!assignedDoctorId) {
      throw new Error('RECEPTIONIST_NO_ASSIGNED_DOCTOR');
    }
    const response = await axios.get(`/api/v1/receptionist/stats/appointments?doctor_id=${assignedDoctorId}`);
    return response.data?.stats ?? response.data;
  }

  async getPatientStats() {
    const assignedDoctorId = localStorage.getItem('assignedDoctorId');
    if (!assignedDoctorId) {
      throw new Error('RECEPTIONIST_NO_ASSIGNED_DOCTOR');
    }
    const response = await axios.get(`/api/v1/receptionist/stats/patients?doctor_id=${assignedDoctorId}`);
    return response.data?.stats ?? response.data;
  }

  async getAssignedDoctor() {
    return {
      doctorId: localStorage.getItem('assignedDoctorId'),
      doctorName: localStorage.getItem('assignedDoctorName') || ''
    };
  }

  async getDoctorAvailability(day) {
    const assignedDoctorId = localStorage.getItem('assignedDoctorId');
    if (!assignedDoctorId) {
      throw new Error('RECEPTIONIST_NO_ASSIGNED_DOCTOR');
    }

    const currentTime = new Date().toISOString();
    const params = new URLSearchParams({
      doctorId: assignedDoctorId,
      day: day,
      currentTime: currentTime
    });

    const response = await axios.get(`/api/v1/doctors/availabilities?${params}`);
    return response.data.availabilities || [];
  }

  async getDoctorAppointments(startDate, endDate) {
    const assignedDoctorId = localStorage.getItem('assignedDoctorId');
    if (!assignedDoctorId) {
      throw new Error('RECEPTIONIST_NO_ASSIGNED_DOCTOR');
    }

    const params = new URLSearchParams({
      userId: assignedDoctorId,
      userType: 'doctor',
      viewAs: 'doctor',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    const response = await axios.get(`/api/v1/reservations?${params}`);
    
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate + 'T23:59:59');
    
    const filteredAppointments = response.data.filter(appointment => {
      const appointmentDate = new Date(appointment.reservationStart || appointment.appointmentStart);
      return appointmentDate >= startDateTime && appointmentDate <= endDateTime;
    });
    return filteredAppointments;
  }

  async checkAppointmentConflict(startTime, endTime) {
    const assignedDoctorId = localStorage.getItem('assignedDoctorId');
    if (!assignedDoctorId) {
      throw new Error('RECEPTIONIST_NO_ASSIGNED_DOCTOR');
    }

    const params = new URLSearchParams({
      doctorId: assignedDoctorId,
      startTime: startTime,
      endTime: endTime
    });

    try {
      const response = await axios.get(`/api/v1/receptionist/appointments/conflicts?${params}`);
      return response.data.conflicts || [];
    } catch (error) {
      throw error;
    }
  }
}

export default new ReceptionistPatientService();

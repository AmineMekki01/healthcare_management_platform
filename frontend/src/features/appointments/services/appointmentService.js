import axios from '../../../components/axiosConfig';

class AppointmentService {

  async fetchReservations(userId, userType) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params = {
      timezone,
      userId: userId,
      userType: userType,
    };

    try {
      const response = await axios.get('/api/v1/reservations', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching reservations:', error);
      throw error;
    }
  }

  async cancelAppointment(appointmentId, canceledBy = 'patient', reason = '') {
    try {
      const response = await axios.post('/api/v1/cancel-appointment', {
        appointmentId: appointmentId,
        canceledBy: canceledBy,
        cancellationReason: reason
      });
      return response.data;
    } catch (error) {
      console.error('Error canceling appointment:', error);
      throw error;
    }
  }

  async getAppointmentStats(userId, userType) {
    try {
      const response = await axios.get('/api/v1/appointments/stats', {
        params: { userId: userId, userType: userType }
      });
      console.log("Appointment stats:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
      throw error;
    }
  }

  async fetchDoctorPatients(doctorId) {
    try {
      const response = await axios.get(`/api/v1/doctors/${doctorId}/patients`);
      return response.data.patients || [];
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      return [];
    }
  }

  async createAppointment(appointmentData) {
    try {
      const startTime = new Date(appointmentData.appointmentStart);
      const endTime = new Date(startTime.getTime() + appointmentData.duration * 60000);

      const requestData = {
        AppointmentStart: appointmentData.appointmentStart,
        AppointmentEnd: endTime.toISOString(),
        DoctorID: appointmentData.doctorId,
        PatientID: appointmentData.patientId,
        Title: appointmentData.appointmentType || 'Consultation',
        Notes: appointmentData.notes || '',
        IsDoctorPatient: appointmentData.isDoctorPatient || false
      };

      const response = await axios.post('/api/v1/reservations', requestData);
      return response.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }
}

export default new AppointmentService();

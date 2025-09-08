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
}

export default new AppointmentService();

import axios from '../../../components/axiosConfig';
import i18n from '../../../i18n';

class AppointmentService {

  async fetchReservations(userId, userType, viewAs) {
    if (!userId) {
      throw new Error(i18n.t('appointments:errors.userIdRequired'));
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const params = {
      timezone,
      userId: userId,
      userType: userType,
    };

    if (viewAs) {
      params.viewAs = viewAs;
    }

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

      if (!endTime || isNaN(endTime.getTime()) || !endTime.getTime || !endTime.getTime()) {
        throw new Error(i18n.t('appointments:errors.invalidEndTime'));
      }

      if (!(endTime > startTime)) {
        throw new Error(i18n.t('appointments:errors.endAfterStart'));
      }

      const requestData = {
        appointmentStart: startTime.toISOString(),
        appointmentEnd: endTime.toISOString(),
        doctorId: appointmentData.doctorId,
        patientId: appointmentData.patientId,
        title: appointmentData.appointmentType || 'Consultation',
        notes: appointmentData.notes || '',
        isDoctorPatient: appointmentData.isDoctorPatient || false
      };

      const response = await axios.post('/api/v1/reservations', requestData);
      return response.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      const message = error?.response?.data?.error || error?.response?.data?.message || error?.message;
      if (message) {
        throw new Error(message);
      }
      throw error;
    }
  }
}

export default new AppointmentService();

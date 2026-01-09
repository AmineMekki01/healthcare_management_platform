import axios from '../../../components/axiosConfig';

const calendarEventService = {
  checkAvailability: async (doctorId, startTime, duration) => {
    try {
      const response = await axios.get(`/api/v1/doctors/${doctorId}/availability/check`, {
        params: { startTime, duration }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  },

  createPersonalEvent: async (doctorId, eventData) => {
    try {
      const response = await axios.post(`/api/v1/doctors/${doctorId}/calendar/events`, eventData);
      return response.data;
    } catch (error) {
      console.error('Error creating personal event:', error);
      throw error;
    }
  },

  findAvailableSlots: async (doctorId, startDate, endDate, duration = 30, limit = 50) => {
    try {
      const response = await axios.get(
        `/api/v1/doctors/${doctorId}/availability/slots`,
        {
          params: {
            startDate,
            endDate,
            duration,
            limit
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error finding available slots:', error);
      throw error;
    }
  },

  getCalendarEvents: async (doctorId, startDate, endDate) => {
    try {
      const response = await axios.get(`/api/v1/doctors/${doctorId}/calendar/events`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  },

  updatePersonalEvent: async (doctorId, eventId, eventData) => {
    try {
      const response = await axios.put(`/api/v1/doctors/${doctorId}/calendar/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      console.error('Error updating personal event:', error);
      throw error;
    }
  },

  deletePersonalEvent: async (doctorId, eventId, deleteAll = false) => {
    try {
      const response = await axios.delete(`/api/v1/doctors/${doctorId}/calendar/events/${eventId}`, {
        params: { deleteAll }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting personal event:', error);
      throw error;
    }
  },

  getHolidays: async (country, year) => {
    try {
      const response = await axios.get('/api/v1/holidays', {
        params: { country, year }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching holidays:', error);
      throw error;
    }
  }
};

export default calendarEventService;

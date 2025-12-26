import axios from '../components/axiosConfig';

const healthProfileService = {
  getHealthProfile: async (userId, userType) => {
    const response = await axios.get(`/api/v1/user/${userId}/health-profile?userType=${userType}`);
    return response.data;
  },

  updateHealthProfile: async (userId, userType, data) => {
    const response = await axios.put(`/api/v1/user/${userId}/health-profile?userType=${userType}`, data);
    return response.data;
  },

  getVaccinations: async (userId, userType) => {
    const response = await axios.get(`/api/v1/user/${userId}/vaccinations?userType=${userType}`);
    return response.data;
  },

  createVaccination: async (userId, userType, data) => {
    const response = await axios.post(`/api/v1/user/${userId}/vaccinations?userType=${userType}`, data);
    return response.data;
  },

  updateVaccination: async (userId, userType, vaccinationId, data) => {
    const response = await axios.put(`/api/v1/user/${userId}/vaccinations/${vaccinationId}?userType=${userType}`, data);
    return response.data;
  },

  deleteVaccination: async (userId, userType, vaccinationId) => {
    const response = await axios.delete(`/api/v1/user/${userId}/vaccinations/${vaccinationId}?userType=${userType}`);
    return response.data;
  },
};

export default healthProfileService;

import axios from '../../../components/axiosConfig';

class ReceptionistStatusService {
  async getAssignmentStatus(receptionistId) {
    const response = await axios.get(`/api/v1/receptionist/${receptionistId}/assignment-status`);
    return response.data?.status || null;
  }
}

export default new ReceptionistStatusService();

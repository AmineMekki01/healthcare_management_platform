import axios from '../../../components/axiosConfig';

class ReceptionistHiringService {
  async listProposals(receptionistId) {
    const response = await axios.get(`/api/v1/receptionist/${receptionistId}/hiring-proposals`);
    return response.data?.proposals || [];
  }

  async respondToProposal(receptionistId, proposalId, action, message = null) {
    const payload = { action, message };
    const response = await axios.patch(
      `/api/v1/receptionist/${receptionistId}/hiring-proposals/${proposalId}`,
      payload
    );
    return response.data?.proposal || null;
  }

  async listMessages(receptionistId, proposalId) {
    const response = await axios.get(
      `/api/v1/receptionist/${receptionistId}/hiring-proposals/${proposalId}/messages`
    );
    return response.data?.messages || [];
  }

  async sendMessage(receptionistId, proposalId, message) {
    const payload = { message };
    const response = await axios.post(
      `/api/v1/receptionist/${receptionistId}/hiring-proposals/${proposalId}/messages`,
      payload
    );
    return response.data?.message || null;
  }
}

export default new ReceptionistHiringService();

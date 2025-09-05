import axiosInstance from '../../../components/axiosConfig';

const API_BASE_URL = 'http://localhost:8000/api/v1/chatbot';

class PatientService {

  async searchPatients(query, userId, limit = 5) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/patients/search/${userId}`, {
        params: { search: query, limit }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  }

  async getPatient(patientId, userId) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/patients/${patientId}`, {
        params: {
          user_id: userId
        }
      });
      
      if (!response.data.success) {
        throw new Error(`Failed to get patient: ${response.data.error}`);
      }

      return response.data.data;
    } catch (error) {
      console.error('Error getting patient:', error);
      throw error;
    }
  }

  async getDoctorPatients(doctorId) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/doctors/${doctorId}/patients`);
      
      if (!response.data.success) {
        throw new Error(`Failed to get doctor patients: ${response.data.error}`);
      }

      return response.data.data;
    } catch (error) {
      console.error('Error getting doctor patients:', error);
      throw error;
    }
  }

  formatPatientName(patient) {
    if (!patient) return '';
    
    const { first_name, last_name, full_name } = patient;
    
    if (full_name) return full_name;
    if (first_name && last_name) return `${first_name} ${last_name}`;
    if (first_name) return first_name;
    
    return 'Unknown Patient';
  }

  createMentionText(patient) {
    const name = this.formatPatientName(patient);
    return `@${name}`;
  }

  parseMentions(text) {
    const mentionRegex = /@([^\s@]+(?:\s+[^\s@]+)*)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push({
        text: match[0],
        name: match[1],
        start: match.index,
        end: match.index + match[0].length
      });
    }

    return mentions;
  }
}

const patientService = new PatientService();
export default patientService;

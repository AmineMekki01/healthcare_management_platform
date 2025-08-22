import axios from '../../../components/axiosConfig';

class PatientService {
  async fetchPatients(filters = {}) {
    try {
      const response = await axios.get('/api/v1/patients', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  async fetchPatient(patientId) {
    try {
      const response = await axios.get(`/api/v1/patients/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw error;
    }
  }

  async createPatient(patientData) {
    try {
      const response = await axios.post('/api/v1/patients', patientData);
      return response.data;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  async updatePatient(patientId, patientData) {
    try {
      const response = await axios.put(`/api/v1/patients/${patientId}`, patientData);
      return response.data;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  async deletePatient(patientId) {
    try {
      await axios.delete(`/api/v1/patients/${patientId}`);
      return true;
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  }

  async searchPatients(query, filters = {}) {
    try {
      const response = await axios.get('/api/v1/patients/search', {
        params: { 
          q: query,
          ...filters 
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  }

  async fetchPatientMedicalHistory(patientId) {
    try {
      const response = await axios.get(`/api/v1/patients/${patientId}/medical-history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching patient medical history:', error);
      throw error;
    }
  }

  async fetchPatientAppointments(patientId, filters = {}) {
    try {
      const response = await axios.get(`/api/v1/patients/${patientId}/appointments`, {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      throw error;
    }
  }

  async getPatientStats(patientId) {
    try {
      const response = await axios.get(`/api/v1/patients/${patientId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching patient stats:', error);
      throw error;
    }
  }

  async updatePatientStatus(patientId, isActive) {
    try {
      const response = await axios.patch(`/api/v1/patients/${patientId}/status`, {
        isActive
      });
      return response.data;
    } catch (error) {
      console.error('Error updating patient status:', error);
      throw error;
    }
  }

  async addMedicalNote(patientId, noteData) {
    try {
      const response = await axios.post(`/api/v1/patients/${patientId}/notes`, noteData);
      return response.data;
    } catch (error) {
      console.error('Error adding medical note:', error);
      throw error;
    }
  }

  async uploadPatientDocument(patientId, file, documentType) {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('patientId', patientId);
      formData.append('documentType', documentType);

      const response = await axios.post(`/api/v1/patients/${patientId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading patient document:', error);
      throw error;
    }
  }

  async fetchPatientDocuments(patientId) {
    try {
      const response = await axios.get(`/api/v1/patients/${patientId}/documents`);
      return response.data;
    } catch (error) {
      console.error('Error fetching patient documents:', error);
      throw error;
    }
  }

  formatPatientName(patient) {
    if (!patient) return '';
    const { firstName, lastName, middleName } = patient;
    return [firstName, middleName, lastName].filter(Boolean).join(' ');
  }

  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  formatPhoneNumber(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  }

  getStatusColor(isActive) {
    return isActive ? '#22c55e' : '#ef4444';
  }

  getPatientInitials(patient) {
    if (!patient) return '';
    const { firstName, lastName } = patient;
    return [firstName?.charAt(0), lastName?.charAt(0)].filter(Boolean).join('').toUpperCase();
  }

  formatMedicalDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  validatePatientData(patientData) {
    const errors = {};
    const { firstName, lastName, email, phone, dateOfBirth } = patientData;

    if (!firstName?.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }

    if (phone && !/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      errors.phone = 'Phone number must be 10 digits';
    }

    if (dateOfBirth && new Date(dateOfBirth) > new Date()) {
      errors.dateOfBirth = 'Date of birth cannot be in the future';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  filterPatients(patients, query = '', filters = {}) {
    let filtered = [...patients];

    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(patient => {
        const fullName = this.formatPatientName(patient).toLowerCase();
        return fullName.includes(searchTerm) ||
               patient.email?.toLowerCase().includes(searchTerm) ||
               patient.phone?.includes(searchTerm) ||
               patient.patientId?.toLowerCase().includes(searchTerm);
      });
    }

    if (filters.status !== undefined) {
      filtered = filtered.filter(patient => 
        filters.status === 'active' ? patient.isActive : !patient.isActive
      );
    }

    if (filters.ageRange) {
      filtered = filtered.filter(patient => {
        const age = this.calculateAge(patient.dateOfBirth);
        if (!age) return false;
        
        switch (filters.ageRange) {
          case 'child': return age < 18;
          case 'adult': return age >= 18 && age < 65;
          case 'senior': return age >= 65;
          default: return true;
        }
      });
    }

    if (filters.gender) {
      filtered = filtered.filter(patient => patient.gender === filters.gender);
    }

    return filtered;
  }

  getPatientStats(patients) {
    const total = patients.length;
    const active = patients.filter(p => p.isActive).length;
    const inactive = total - active;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const newThisMonth = patients.filter(p => 
      new Date(p.createdAt) >= thirtyDaysAgo
    ).length;

    const genderStats = patients.reduce((acc, patient) => {
      const gender = patient.gender || 'Unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    const ageGroups = patients.reduce((acc, patient) => {
      const age = this.calculateAge(patient.dateOfBirth);
      if (age === null) {
        acc.Unknown = (acc.Unknown || 0) + 1;
      } else if (age < 18) {
        acc.Child = (acc.Child || 0) + 1;
      } else if (age < 65) {
        acc.Adult = (acc.Adult || 0) + 1;
      } else {
        acc.Senior = (acc.Senior || 0) + 1;
      }
      return acc;
    }, {});

    return {
      total,
      active,
      inactive,
      newThisMonth,
      genderStats,
      ageGroups
    };
  }
}

export const patientService = new PatientService();
export default patientService;

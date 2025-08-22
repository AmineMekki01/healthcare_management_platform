import axios from '../../../components/axiosConfig';

class AuthService {
  async login(credentials) {
    let url;
    if (credentials.userType === 'doctor') {
      url = '/api/v1/doctors/login';
    } else if (credentials.userType === 'receptionist') {
      url = '/api/v1/auth/login/receptionist';
    } else {
      url = '/api/v1/patients/login';
    }

    const response = await axios.post(url, credentials);
    
    if (credentials.userType === 'receptionist') {
      return {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        userId: response.data.receptionist.receptionistId,
        userType: 'receptionist',
        firstName: response.data.receptionist.firstName,
        lastName: response.data.receptionist.lastName,
        profilePictureUrl: response.data.receptionist.profilePictureUrl,
        assignedDoctorId: response.data.receptionist.assignedDoctorId,
        ...response.data
      };
    }
    
    return response.data;
  }

  async registerDoctor(doctorData) {
    const response = await axios.post('/api/v1/doctors/register', doctorData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async registerPatient(patientData) {
    const response = await axios.post('/api/v1/patients/register', patientData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async registerReceptionist(receptionistData) {
    const response = await axios.post('/api/v1/auth/register/receptionist', receptionistData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  }

  async requestPasswordReset(email, userType) {
    const response = await axios.post('/api/v1/request-reset', { email, localUserType: userType });
    return response.data;
  }

  async resetPassword(token, newPassword) {
    const response = await axios.post('/api/v1/reset-password', { token, newPassword });
    return response.data;
  }

  async verifyAccount(token) {
    const response = await axios.get(`/activate_account?token=${token}`);
    return response.data;
  }

  async refreshToken() {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post('/api/v1/refresh-token', {}, {
      headers: {
        'Authorization': `Bearer ${storedRefreshToken}`,
      }
    });
    
    return response.data;
  }

  async forgotPassword(email) {
    const response = await axios.post('/api/v1/forgot-password', { email });
    return response.data;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    window.location.href = '/login';
  }

  getCurrentUser() {
    return {
      userId: localStorage.getItem('userId'),
      userFullName: localStorage.getItem('userFullName'),
      userType: localStorage.getItem('userType'),
    };
  }

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  hasRole(requiredRole) {
    const userType = localStorage.getItem('userType');
    return userType === requiredRole;
  }
}

export default new AuthService();

import axios from '../../../components/axiosConfig';

class AuthService {
  async me() {
    const response = await axios.get('/api/v1/auth/me');
    return response.data;
  }

  async login(credentials) {
    let url;
    if (credentials.userType === 'doctor') {
      url = '/api/v1/auth/login/doctor';
    } else if (credentials.userType === 'receptionist') {
      url = '/api/v1/auth/login/receptionist';
    } else {
      url = '/api/v1/auth/login/patient';
    }

    const response = await axios.post(url, credentials);

    const { accessToken: _accessToken, refreshToken: _refreshToken, ...data } = response.data;

    if (credentials.userType === 'receptionist') {
      return {
        userId: response.data.receptionist.receptionistId,
        userType: 'receptionist',
        firstName: response.data.receptionist.firstName,
        lastName: response.data.receptionist.lastName,
        profilePictureUrl: response.data.receptionist.profilePictureUrl,
        assignedDoctorId: response.data.receptionist.assignedDoctorId,
        ...data
      };
    }
    
    return data;
  }

  async registerDoctor(doctorData) {
    const response = await axios.post('/api/v1/auth/register/doctor', doctorData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async registerPatient(patientData) {
    const response = await axios.post('/api/v1/auth/register/patient', patientData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async registerReceptionist(receptionistData) {
    const response = await axios.post('/api/v1/auth/register/receptionist', receptionistData);
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
    const response = await axios.post('/api/v1/refresh-token', {});
    return response.data;
  }

  async forgotPassword(email) {
    const response = await axios.post('/api/v1/forgot-password', { email });
    return response.data;
  }

  async logout() {
    const response = await axios.post('/api/v1/auth/logout', {});
    return response.data;
  }

  getCurrentUser() {
    return {
      userId: localStorage.getItem('userId'),
      userFullName: localStorage.getItem('userFullName'),
      userType: localStorage.getItem('userType'),
    };
  }

  isAuthenticated() {
    return !!localStorage.getItem('userId');
  }

  hasRole(requiredRole) {
    const userType = localStorage.getItem('userType');
    return userType === requiredRole;
  }
}

export default new AuthService();

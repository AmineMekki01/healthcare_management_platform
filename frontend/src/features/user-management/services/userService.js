import axiosInstance from '../../../components/axiosConfig';
import { userUtils } from '../utils';

class UserService {
  constructor() {
    this.axiosInstance = axiosInstance;
  }

  async handleApiCall(apiCall, operation = 'API operation') {
    try {
      const response = await apiCall();
      return response.data;
    } catch (error) {
      console.error(`Error in ${operation}:`, error);
      const message = error.response?.data?.error || error.message || `Failed to ${operation}`;
      throw new Error(message);
    }
  }

  formatFullName(firstName, lastName) {
    const first = firstName?.trim() || '';
    const last = lastName?.trim() || '';
    return [first, last].filter(Boolean).join(' ') || 'Unknown User';
  }

  generateInitials(firstName, lastName) {
    const first = firstName?.trim()?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.trim()?.charAt(0)?.toUpperCase() || '';
    return (first + last) || 'U';
  }

  transformUserData(user, userType) {
    if (!user) return null;

    const getFieldValue = (obj, ...fieldNames) => {
      for (const fieldName of fieldNames) {
        if (obj[fieldName] !== undefined && obj[fieldName] !== null) {
          return obj[fieldName];
        }
      }
      return '';
    };

    const baseData = {
      id: getFieldValue(user, 'doctorId', 'receptionistId', 'patientId'),
      userId: getFieldValue(user, 'doctorId', 'receptionistId', 'patientId'),
      username: getFieldValue(user, 'username'),
      firstName: getFieldValue(user, 'firstName'),
      lastName: getFieldValue(user, 'lastName'),
      email: getFieldValue(user, 'email'),
      phoneNumber: getFieldValue(user, 'phoneNumber'),
      bio: getFieldValue(user, 'bio'),
      profilePhotoUrl: getFieldValue(user, 'profilePhotoUrl'),
      isActive: user.is_active || user.IsActive || false,
      emailVerified: user.email_verified || user.EmailVerified || false,
      createdAt: getFieldValue(user, 'createdAt'),
      updatedAt: getFieldValue(user, 'updatedAt'),
      userType: userType || getFieldValue(user, 'userType'),
      fullName: this.formatFullName(
        getFieldValue(user, 'firstName'), 
        getFieldValue(user, 'lastName')
      ),
      initials: this.generateInitials(
        getFieldValue(user, 'firstName'), 
        getFieldValue(user, 'lastName')
      ),
      lastActive: getFieldValue(user, 'lastActive'),
      contactInfo: {
        email: getFieldValue(user, 'email'),
        phone: getFieldValue(user, 'phoneNumber'),
        verified: user.emailVerified || false
      },
      address: getFieldValue(user, 'streetAddress'),
      city: getFieldValue(user, 'cityName'),
      state: getFieldValue(user, 'stateName'),
      zipCode: getFieldValue(user, 'zipCode'),
      country: getFieldValue(user, 'countryName'),
      dateOfBirth: getFieldValue(user, 'birthDate'),
      gender: getFieldValue(user, 'sex'),
      age: getFieldValue(user, 'age'),
      location: getFieldValue(user, 'location'),
    };

    if (userType === 'doctor') {
      return {
        ...baseData,
        specialization: getFieldValue(user, 'Specialty', 'specialty'),
        experience: getFieldValue(user, 'Experience', 'experience'),
        qualification: getFieldValue(user, 'qualification', 'Qualification'),
        licenseNumber: getFieldValue(user, 'MedicalLicense', 'medical_license'),
        consultationFee: user.consultationFee || 0,
        availability: user.availability || [],
        rating: user.rating || 0,
        totalReviews: user.totalReviews || 0,
        languages: user.languages || [],
        education: user.education || [],
        certifications: user.certifications || [],
        hospitals: user.hospitals || [],
        organizations: user.organizations || [],
        awards: user.awards || [],
        latitude: user.latitude || 0,
        longitude: user.longitude || 0,
      };
    }

    if (userType === 'patient') {
      return {
        ...baseData,
        bloodType: getFieldValue(user, 'bloodType'),
        emergencyContact: user.emergencyContact || {},
        medicalHistory: user.medicalHistory || [],
        allergies: user.allergies || [],
        medications: user.medications || [],
        insuranceInfo: user.insuranceInfo || {},
        totalAppointments: user.totalAppointments || 0,
        totalRecords: user.totalRecords || 0,
        totalVisits: user.totalVisits || 0,
        doctorsVisited: user.doctorsVisited || 0,
        lastVisit: getFieldValue(user, 'lastVisit'),
      };
    }

    if (userType === 'receptionist') {
      return {
        ...baseData,
        assignedDoctorId: getFieldValue(user, 'assignedDoctorId'),
        permissions: user.permissions || [],
        workSchedule: user.workSchedule || [],
        department: getFieldValue(user, 'department'),
        position: getFieldValue(user, 'position'),
        salary: user.salary || 0,
        hireDate: getFieldValue(user, 'hireDate'),
        receptionistId: getFieldValue(user, 'receptionistId'),
      };
    }

    return baseData;
  }

  async getUserProfile(userId, userType) {
    try {
      let endpoint;
      let params = {};
      
      if (userType === 'doctor') {
        endpoint = `/api/v1/doctors/${userId}`;
      } else if (userType === 'patient') {
        endpoint = `/api/v1/patient/${userId}`;
      } else if (userType === 'receptionist') {
        endpoint = `/api/v1/receptionist/${userId}`;
      } else {
        endpoint = `/api/v1/user/${userId}`;
        params.userType = userType;
      }

      const response = await this.axiosInstance.get(endpoint, { params });
      
      const userData = userType === 'receptionist' 
        ? response.data.receptionist || response.data 
        : response.data;
        
      return {
        ...userData,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        bio: userData.bio || '',
        streetAddress: userData.streetAddress || '',
        cityName: userData.cityName || '',
        stateName: userData.stateName || '',
        zipCode: userData.zipCode || '',
        countryName: userData.countryName || '',
        profilePictureUrl: userData.profilePictureUrl || '',
        birthDate: userData.birthDate || '',
        sex: userData.sex || '',
        age: userData.age || null,
        experiences: userData.experiences || [],
        experienceYears: typeof userData.experienceYears === 'number' ? userData.experienceYears : 0,
      };
    } catch (error) {
      console.error(`Error fetching ${userType} profile:`, error);
      const message = error.response?.data?.error || error.message || `Failed to fetch ${userType} profile`;
      throw new Error(message);
    }
  }

  async listReceptionistExperiences(receptionistId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`/api/v1/receptionist/${receptionistId}/experiences`);
      return response.data.experiences || [];
    }, 'list receptionist experiences');
  }

  async createReceptionistExperience(receptionistId, payload) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.post(`/api/v1/receptionist/${receptionistId}/experiences`, payload);
      return response.data.experience;
    }, 'create receptionist experience');
  }

  async deleteReceptionistExperience(receptionistId, experienceId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.delete(`/api/v1/receptionist/${receptionistId}/experiences/${experienceId}`);
      return response.data;
    }, 'delete receptionist experience');
  }
  async updateUserProfile(userId, userType, profileData) {
    return this.handleApiCall(async () => {
      const transformedData = userUtils.transformProfileDataForApi(profileData, userType);
      let endpoint;
      
      if (userType === 'doctor') {
        endpoint = `/api/v1/doctors/${userId}`;
      } else if (userType === 'patient') {
        endpoint = `/api/v1/patients/${userId}`;
      } else if (userType === 'receptionist') {
        endpoint = `/api/v1/receptionist/${userId}`;
      } else {
        endpoint = `/api/v1/user/profile/${userId}`;
      }

      const response = await this.axiosInstance.put(endpoint, transformedData);
      const userData = userType === 'receptionist' 
        ? response.data.receptionist || response.data 
        : response.data;
        
      return this.transformUserData(userData, userType);
    }, `update ${userType} profile`);
  }

  async uploadUserImage(userId, userType, imageFile, onProgress = null) {
    return this.handleApiCall(async () => {
      const formData = new FormData();
      formData.append('profile_photo', imageFile);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress ? (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        } : undefined
      };

      let endpoint;
      if (userType === 'doctor') {
        endpoint = `/api/v1/doctors/profile-photo/${userId}`;
      } else if (userType === 'patient') {
        endpoint = `/api/v1/patients/profile-photo/${userId}`;
      } else if (userType === 'receptionist') {
        endpoint = `/api/v1/receptionists/profile-photo/${userId}`;
      } else {
        endpoint = '/api/v1/users/upload-image';
        formData.append('userId', userId);
        formData.append('userType', userType);
      }

      const response = await this.axiosInstance.post(endpoint, formData, config);
      return response.data.profile_photo_url || response.data.imageUrl;
    }, 'upload user image');
  }

  async searchUsers(searchCriteria) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get('/api/v1/users/search', {
        params: searchCriteria
      });
      
      const results = response.data.results || response.data.users || [];
      return results.map(user => this.transformUserData(user, user.user_type));
    }, 'search users');
  }

  async getUsersByType(userType, filters = {}) {
    return this.handleApiCall(async () => {
      let endpoint;
      
      if (userType === 'doctor') {
        endpoint = '/api/v1/doctors';
      } else if (userType === 'patient') {
        endpoint = '/api/v1/patients';
      } else if (userType === 'receptionist') {
        endpoint = '/api/v1/receptionists';
      } else {
        endpoint = '/api/v1/users';
      }

      const response = await this.axiosInstance.get(endpoint, { 
        params: userType === 'doctor' || userType === 'patient' || userType === 'receptionist' 
          ? filters 
          : { userType, ...filters } 
      });
      
      const users = response.data[`${userType}s`] || response.data.users || response.data;
      return Array.isArray(users) ? users.map(user => this.transformUserData(user, userType)) : [];
    }, `fetch ${userType}s`);
  }

  async deleteUser(userId, userType) {
    return this.handleApiCall(async () => {
      let endpoint;
      
      if (userType === 'doctor') {
        endpoint = `/api/v1/doctors/${userId}`;
      } else if (userType === 'patient') {
        endpoint = `/api/v1/patients/${userId}`;
      } else if (userType === 'receptionist') {
        endpoint = `/api/v1/receptionists/${userId}`;
      } else {
        endpoint = `/api/v1/users/${userId}`;
      }

      await this.axiosInstance.delete(endpoint);
      return true;
    }, `delete ${userType}`);
  }

  async toggleUserStatus(userId, userType, isActive) {
    return this.handleApiCall(async () => {
      let endpoint;
      
      if (userType === 'doctor') {
        endpoint = `/api/v1/doctors/${isActive ? 'activate' : 'deactivate'}/${userId}`;
      } else if (userType === 'patient') {
        endpoint = `/api/v1/patients/${isActive ? 'activate' : 'deactivate'}/${userId}`;
      } else if (userType === 'receptionist') {
        endpoint = `/api/v1/receptionists/${isActive ? 'activate' : 'deactivate'}/${userId}`;
      } else {
        endpoint = `/api/v1/users/${userId}/status`;
      }

      const response = await this.axiosInstance.patch(endpoint, 
        userType === 'doctor' || userType === 'patient' || userType === 'receptionist' 
          ? {} 
          : { isActive }
      );
      
      return this.transformUserData(response.data, userType);
    }, `toggle ${userType} status`);
  }

  async getDoctorSchedule(doctorId, dateRange = {}) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`/api/v1/doctors/${doctorId}/weekly_schedule`, {
        params: dateRange
      });
      return userUtils.transformScheduleData(response.data);
    }, 'get doctor schedule');
  }

  async updateDoctorSchedule(doctorId, schedule) {
    return this.handleApiCall(async () => {
      const transformedSchedule = userUtils.transformScheduleForApi(schedule);
      const response = await this.axiosInstance.put(`/api/v1/doctors/${doctorId}/weekly_schedule`, {
        schedule: transformedSchedule
      });
      return response.data;
    }, 'update doctor schedule');
  }

  async getDoctorAvailabilities(filters = {}) {
    return this.handleApiCall(async () => {
      const { doctorId, date } = filters;
      const currentTime = new Date().toISOString();
      
      return await this.axiosInstance.get('/api/v1/doctors/availabilities', {
        params: {
          doctorId,
          day: date,
          currentTime,
          ...filters
        }
      });
    }, 'get doctor availabilities').then(data => {
      console.log('Doctor availabilities fetched 1 :', data);
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.availabilities)) return data.availabilities;
      console.warn('Unexpected availabilities response shape', data);
      return [];
    });
  }

  async createAppointment(appointmentData) {
    return this.handleApiCall(async () => {
      const transformedData = userUtils.transformAppointmentDataForApi(appointmentData);
      console.log('Transformed appointment data:', transformedData);
      const appointmentDateTime = new Date(`${appointmentData.date}T${appointmentData.time}:00`);
      const endDateTime = new Date(appointmentDateTime.getTime() + (30 * 60 * 1000));

      const backendData = {
        appointmentStart: appointmentDateTime.toISOString(),
        appointmentEnd: endDateTime.toISOString(),
        appointmentTitle: appointmentData.reasonForVisit || 'Medical Consultation',
        doctorId: appointmentData.doctorId,
        patientId: appointmentData.patientId,
        isDoctorPatient: appointmentData.isDoctorPatient || false,
        availabilityId: appointmentData.availabilityId,
        ...transformedData
      };

      const response = await this.axiosInstance.post('/api/v1/reservations', backendData);
      return response;
    }, 'create appointment');
  }

  async getUserAppointments(filters = {}) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get('/api/v1/reservations', {
        params: filters
      });
      return response.data.appointments || response.data.reservations || response.data;
    }, 'get user appointments');
  }

  async getAppointment(appointmentId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`/api/v1/appointments/${appointmentId}`);
      return response.data;
    }, 'get appointment');
  }

  async updateAppointment(appointmentId, updateData) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.put(`/api/v1/appointments/${appointmentId}`, updateData);
      return response.data;
    }, 'update appointment');
  }

  async cancelAppointment(cancelData) {
    return this.handleApiCall(async () => {
      const payload = {
        appointmentId: cancelData.appointmentId,
        canceled_by: cancelData.canceledBy,
        cancellation_reason: cancelData.reason
      };
      
      const response = await this.axiosInstance.post('/api/v1/cancel-appointment', payload);
      return response.data;
    }, 'cancel appointment');
  }

  async getAppointmentStats(filters = {}) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get('/api/v1/appointments/stats', {
        params: filters
      });
      return userUtils.transformStatsData(response.data);
    }, 'get appointment stats');
  }

  async getUserStats(userId, userType, timeRange = '30d') {
    return this.handleApiCall(async () => {
      let endpoint;
      
      if (userType === 'doctor') {
        endpoint = `/api/v1/doctors/stats/${userId}`;
      } else if (userType === 'patient') {
        endpoint = `/api/v1/patients/stats/${userId}`;
      } else if (userType === 'receptionist') {
        endpoint = `/api/v1/receptionists/stats/${userId}`;
      } else {
        endpoint = `/api/v1/users/stats/${userId}`;
      }

      const response = await this.axiosInstance.get(endpoint, {
        params: { time_range: timeRange }
      });
      return userUtils.transformUserStatsData(response.data, userType);
    }, `get ${userType} stats`);
  }

  async getUserNotifications(userId, page = 1, limit = 20) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`/api/v1/users/notifications/${userId}`, {
        params: { page, limit }
      });
      return {
        notifications: response.data.notifications || [],
        pagination: response.data.pagination || {}
      };
    }, 'get user notifications');
  }

  async markNotificationAsRead(notificationId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.put(`/api/v1/notifications/read/${notificationId}`);
      return response.data;
    }, 'mark notification as read');
  }

  async sendMessage(recipientId, message) {
    return this.handleApiCall(async () => {
      const payload = {
        recipient_id: recipientId,
        message: message.content,
        message_type: message.type || 'text',
        priority: message.priority || 'normal'
      };
      const response = await this.axiosInstance.post('/api/v1/messages/send', payload);
      return response.data;
    }, 'send message');
  }

  async getUserMessages(userId, page = 1, limit = 50) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`/api/v1/messages/user/${userId}`, {
        params: { page, limit }
      });
      return {
        messages: response.data.messages || [],
        pagination: response.data.pagination || {}
      };
    }, 'get user messages');
  }

  async updateUserStatus(userId, userType, status, statusMessage = '') {
    return this.handleApiCall(async () => {
      let endpoint;
      
      if (userType === 'doctor') {
        endpoint = `/api/v1/doctors/status/${userId}`;
      } else if (userType === 'patient') {
        endpoint = `/api/v1/patients/status/${userId}`;
      } else if (userType === 'receptionist') {
        endpoint = `/api/v1/receptionists/status/${userId}`;
      } else {
        endpoint = `/api/v1/users/status/${userId}`;
      }

      const payload = {
        status,
        status_message: statusMessage,
        timestamp: new Date().toISOString()
      };
      const response = await this.axiosInstance.put(endpoint, payload);
      return response.data;
    }, 'update user status');
  }

  async getUserHistory(userId, userType, page = 1, limit = 20) {
    return this.handleApiCall(async () => {
      let endpoint;
      
      if (userType === 'doctor') {
        endpoint = `/api/v1/doctors/history/${userId}`;
      } else if (userType === 'patient') {
        endpoint = `/api/v1/patients/history/${userId}`;
      } else if (userType === 'receptionist') {
        endpoint = `/api/v1/receptionists/history/${userId}`;
      } else {
        endpoint = `/api/v1/users/history/${userId}`;
      }

      const response = await this.axiosInstance.get(endpoint, {
        params: { page, limit }
      });
      return {
        history: response.data.history || [],
        pagination: response.data.pagination || {}
      };
    }, 'get user history');
  }

  async generateUserReport(userId, userType, reportType = 'summary', filters = {}) {
    return this.handleApiCall(async () => {
      let endpoint;
      
      if (userType === 'doctor') {
        endpoint = `/api/v1/doctors/report/${userId}`;
      } else if (userType === 'patient') {
        endpoint = `/api/v1/patients/report/${userId}`;
      } else if (userType === 'receptionist') {
        endpoint = `/api/v1/receptionists/report/${userId}`;
      } else {
        endpoint = `/api/v1/users/report/${userId}`;
      }

      const params = { 
        report_type: reportType,
        ...filters
      };
      const response = await this.axiosInstance.get(endpoint, { params });
      return userUtils.transformReportData(response.data);
    }, 'generate user report');
  }

  async exportUserData(userType, format = 'csv', filters = {}) {
    return this.handleApiCall(async () => {
      let endpoint;
      
      if (userType === 'doctor') {
        endpoint = '/api/v1/doctors/export';
      } else if (userType === 'patient') {
        endpoint = '/api/v1/patients/export';
      } else if (userType === 'receptionist') {
        endpoint = '/api/v1/receptionists/export';
      } else {
        endpoint = '/api/v1/users/export';
      }

      const params = {
        format,
        ...filters
      };
      const response = await this.axiosInstance.get(endpoint, {
        params,
        responseType: 'blob'
      });
      return response.data;
    }, 'export user data');
  }
}

export const userService = new UserService();
export default userService;

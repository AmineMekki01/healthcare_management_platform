import axios from './../../../components/axiosConfig'
import { staffUtils } from '../utils';

class StaffService {
  constructor() {
    this.axiosInstance = axios;
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

  transformReceptionistData(receptionist) {
    if (!receptionist) return null;

    return {
      id: receptionist.receptionistId,
      receptionistId: receptionist.receptionistId,
      username: receptionist.username || '',
      firstName: receptionist.firstName || '',
      lastName: receptionist.lastName || '',
      email: receptionist.email || '',
      phoneNumber: receptionist.phoneNumber || '',
      bio: receptionist.bio || '',
      profilePhotoUrl: receptionist.profilePictureUrl || '',
      assignedDoctorId: receptionist.assignedDoctorId || null,
      isActive: receptionist.isActive || false,
      emailVerified: receptionist.emailVerified || false,
      createdAt: receptionist.createdAt || null,
      updatedAt: receptionist.updatedAt || null,
      role: 'Receptionist',
      status: receptionist.isActive ? 'active' : 'inactive',
      fullName: staffUtils.formatFullName(receptionist.firstName, receptionist.lastName),
      initials: staffUtils.generateInitials(receptionist.firstName, receptionist.lastName),
      lastActive: receptionist.lastActive || null,
      permissions: receptionist.permissions || [],
      workSchedule: receptionist.workSchedule || [],
      joiningDate: receptionist.createdAt,
      experience: staffUtils.calculateExperience(receptionist.createdAt),
      contactInfo: {
        email: receptionist.email,
        phone: receptionist.phoneNumber,
        verified: receptionist.emailVerified
      }
    };
  }

  async fetchStaff(doctorId) {
    return this.handleApiCall(async () => {
      return await this.axiosInstance.get(`/api/v1/doctor/staff/${doctorId}`);
    }, 'fetch staff').then(data => {
      const staff = data.staff || [];
      console.log('Fetched staff:', staff);
      return staff.map(this.transformReceptionistData.bind(this));
    });
  }

  async fetchStaffById(staffId) {
    return this.handleApiCall(async () => {
      return await this.axiosInstance.get(`/receptionist/profile/${staffId}`);
    }, 'fetch staff member').then(data => {
      return this.transformReceptionistData(data);
    });
  }

  async searchStaff(query, filters = {}) {
    return this.handleApiCall(async () => {
      const params = {
        q: query,
        ...filters
      };
      return await this.axiosInstance.get('/api/v1/staff/search', { params });
    }, 'search staff').then(data => {
      const results = data.results || [];
      return results.map(this.transformReceptionistData.bind(this));
    });
  }

  async fetchTalentPool(filters = {}) {
    return this.handleApiCall(async () => {
      return await this.axiosInstance.get('/api/v1/receptionist/talent-pool', {
        params: filters
      });
    }, 'fetch talent pool').then(data => {
      console.log('Fetched talent pool:', data);
      const receptionists = data.talent_pool || [];
      return receptionists.map(this.transformReceptionistData.bind(this));
    });
  }

  async hireReceptionist(receptionistId, doctorId, contractDetails = {}) {
    return this.handleApiCall(async () => {
      const payload = {
        receptionistId: receptionistId,
        doctor_id: doctorId,
        contract_type: contractDetails.type || 'full-time',
        start_date: contractDetails.startDate || new Date().toISOString(),
        salary: contractDetails.salary,
        permissions: contractDetails.permissions || [],
        work_schedule: contractDetails.workSchedule || []
      };
      const response = await this.axiosInstance.post('/api/v1/doctor/hire-receptionist', payload);
      return this.transformReceptionistData(response.data.receptionist);
    }, 'hire receptionist');
  }

  async dismissReceptionist(receptionistId, reason = '') {
    return this.handleApiCall(async () => {
      const payload = { reason };
      const response = await this.axiosInstance.post(`/api/v1/doctor/dismiss-receptionist/${receptionistId}`, payload);
      return response.data;
    }, 'dismiss receptionist');
  }

  async activateReceptionist(receptionistId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.put(`/api/v1/receptionist/activate/${receptionistId}`);
      return this.transformReceptionistData(response.data.receptionist);
    }, 'activate receptionist');
  }

  async deactivateReceptionist(receptionistId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.put(`/api/v1/receptionist/deactivate/${receptionistId}`);
      return this.transformReceptionistData(response.data.receptionist);
    }, 'deactivate receptionist');
  }

  async updateStaffProfile(staffId, profileData) {
    return this.handleApiCall(async () => {
      const transformedData = staffUtils.transformProfileDataForApi(profileData);
      const response = await this.axiosInstance.put(`/api/v1/receptionist/profile/${staffId}`, transformedData);
      return this.transformReceptionistData(response.data.receptionist);
    }, 'update staff profile');
  }

  async updateStaffPermissions(staffId, permissions) {
    return this.handleApiCall(async () => {
      const payload = { permissions };
      const response = await this.axiosInstance.put(`/api/v1/receptionist/permissions/${staffId}`, payload);
      return response.data;
    }, 'update staff permissions');
  }

  async updateWorkSchedule(staffId, schedule) {
    return this.handleApiCall(async () => {
      const transformedSchedule = staffUtils.transformScheduleForApi(schedule);
      const payload = { work_schedule: transformedSchedule };
      const response = await this.axiosInstance.put(`/api/v1/receptionist/schedule/${staffId}`, payload);
      return response.data;
    }, 'update work schedule');
  }

  async fetchStaffStatistics(doctorId, timeRange = '30d') {
    return this.handleApiCall(async () => {
      const params = { time_range: timeRange };
      const response = await this.axiosInstance.get(`/api/v1/doctor/staff-statistics/${doctorId}`, { params });
      return staffUtils.transformStatisticsData(response.data);
    }, 'fetch staff statistics');
  }

  async fetchStaffPerformance(staffId, timeRange = '30d') {
    return this.handleApiCall(async () => {
      const params = { time_range: timeRange };
      const response = await this.axiosInstance.get(`/api/v1/receptionist/performance/${staffId}`, { params });
      return staffUtils.transformPerformanceData(response.data);
    }, 'fetch staff performance');
  }

  async uploadProfilePhoto(staffId, file, onProgress = null) {
    return this.handleApiCall(async () => {
      const formData = new FormData();
      formData.append('profile_photo', file);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress ? (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        } : undefined
      };

      const response = await this.axiosInstance.post(`/api/v1/receptionist/profile-photo/${staffId}`, formData, config);
      return response.data.profilePictureUrl;
    }, 'upload profile photo');
  }

  async fetchStaffHistory(staffId, page = 1, limit = 20) {
    return this.handleApiCall(async () => {
      const params = { page, limit };
      const response = await this.axiosInstance.get(`/api/v1/receptionist/history/${staffId}`, { params });
      return {
        history: response.data.history || [],
        pagination: response.data.pagination || {}
      };
    }, 'fetch staff history');
  }

  async inviteReceptionist(inviteData) {
    return this.handleApiCall(async () => {
      const transformedData = staffUtils.transformInviteDataForApi(inviteData);
      const response = await this.axiosInstance.post('/api/v1/receptionist/invite', transformedData);
      return response.data;
    }, 'invite receptionist');
  }

  async resendInvitation(inviteId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.post(`/api/v1/receptionist/invite/resend/${inviteId}`);
      return response.data;
    }, 'resend invitation');
  }

  async cancelInvitation(inviteId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.delete(`/api/v1/receptionist/invite/${inviteId}`);
      return response.data;
    }, 'cancel invitation');
  }

  async fetchPendingInvitations(doctorId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`/api/v1/doctor/pending-invitations/${doctorId}`);
      return response.data.invitations || [];
    }, 'fetch pending invitations');
  }

  async generateStaffReport(doctorId, reportType = 'summary', filters = {}) {
    return this.handleApiCall(async () => {
      const params = { 
        report_type: reportType,
        ...filters
      };
      const response = await this.axiosInstance.get(`/api/v1/doctor/staff-report/${doctorId}`, { params });
      return staffUtils.transformReportData(response.data);
    }, 'generate staff report');
  }

  async exportStaffData(doctorId, format = 'csv', filters = {}) {
    return this.handleApiCall(async () => {
      const params = {
        format,
        ...filters
      };
      const response = await this.axiosInstance.get(`/api/v1/doctor/staff-export/${doctorId}`, {
        params,
        responseType: 'blob'
      });
      return response.data;
    }, 'export staff data');
  }

  async fetchStaffNotifications(staffId, page = 1, limit = 20) {
    return this.handleApiCall(async () => {
      const params = { page, limit };
      const response = await this.axiosInstance.get(`/api/v1/receptionist/notifications/${staffId}`, { params });
      return {
        notifications: response.data.notifications || [],
        pagination: response.data.pagination || {}
      };
    }, 'fetch staff notifications');
  }

  async markNotificationAsRead(notificationId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.put(`/api/v1/notifications/read/${notificationId}`);
      return response.data;
    }, 'mark notification as read');
  }

  async sendMessage(staffId, message) {
    return this.handleApiCall(async () => {
      const payload = {
        recipient_id: staffId,
        message: message.content,
        message_type: message.type || 'text',
        priority: message.priority || 'normal'
      };
      const response = await this.axiosInstance.post('/api/v1/messages/send', payload);
      return response.data;
    }, 'send message to staff');
  }

  async fetchStaffMessages(staffId, page = 1, limit = 50) {
    return this.handleApiCall(async () => {
      const params = { page, limit };
      const response = await this.axiosInstance.get(`/api/v1/messages/staff/${staffId}`, { params });
      return {
        messages: response.data.messages || [],
        pagination: response.data.pagination || {}
      };
    }, 'fetch staff messages');
  }

  async updateStaffStatus(staffId, status, statusMessage = '') {
    return this.handleApiCall(async () => {
      const payload = {
        status,
        status_message: statusMessage,
        timestamp: new Date().toISOString()
      };
      const response = await this.axiosInstance.put(`/api/v1/receptionist/status/${staffId}`, payload);
      return response.data;
    }, 'update staff status');
  }

  async logStaffActivity(staffId, activity) {
    return this.handleApiCall(async () => {
      const payload = {
        activity_type: activity.type,
        description: activity.description,
        timestamp: activity.timestamp || new Date().toISOString(),
        metadata: activity.metadata || {}
      };
      const response = await this.axiosInstance.post(`/api/v1/receptionist/activity/${staffId}`, payload);
      return response.data;
    }, 'log staff activity');
  }

  async fetchStaffAvailability(staffId, dateRange) {
    return this.handleApiCall(async () => {
      const params = {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      };
      const response = await this.axiosInstance.get(`/api/v1/receptionist/availability/${staffId}`, { params });
      return staffUtils.transformAvailabilityData(response.data);
    }, 'fetch staff availability');
  }

  async updateStaffAvailability(staffId, availability) {
    return this.handleApiCall(async () => {
      const transformedAvailability = staffUtils.transformAvailabilityForApi(availability);
      const payload = { availability: transformedAvailability };
      const response = await this.axiosInstance.put(`/api/v1/receptionist/availability/${staffId}`, payload);
      return response.data;
    }, 'update staff availability');
  }
}

export const staffService = new StaffService();
export default staffService;

import axios from './../../../components/axiosConfig'
import { staffUtils } from '../utils';

class StaffService {
  constructor() {
    this.axiosInstance = axios;
  }

  async handleApiCall(apiCall, operation = 'API operation') {
    try {
      const response = await apiCall();
      return response?.data ?? response;
    } catch (error) {
      console.error(`Error in ${operation}:`, error);
      const message = error.response?.data?.error || error.message || `Failed to ${operation}`;
      throw new Error(message);
    }
  }

  transformReceptionistData(receptionist) {
    if (!receptionist) return null;

    const lang = String(localStorage.getItem('i18nextLng') || '').toLowerCase();
    const isArabic = lang.startsWith('ar');

    const receptionistId = receptionist.receptionistId || receptionist.receptionist_id || receptionist.id;

    const firstName = receptionist.firstName || receptionist.first_name || '';
    const lastName = receptionist.lastName || receptionist.last_name || '';
    const firstNameAr = receptionist.firstNameAr || receptionist.first_name_ar || '';
    const lastNameAr = receptionist.lastNameAr || receptionist.last_name_ar || '';

    const displayFirstName = isArabic ? (firstNameAr || firstName) : firstName;
    const displayLastName = isArabic ? (lastNameAr || lastName) : lastName;
    const displayFullName = `${displayFirstName || ''} ${displayLastName || ''}`.trim();

    const experienceYears = typeof receptionist.experienceYears === 'number'
      ? receptionist.experienceYears
      : (typeof receptionist.experience_years === 'number' ? receptionist.experience_years : 0);

    const profilePictureUrl = receptionist.profilePictureUrl
      || receptionist.profile_picture_url
      || receptionist.profilePhotoUrl
      || receptionist.profile_photo_url
      || '';

    return {
      id: receptionistId,
      receptionistId,
      username: receptionist.username || '',
      firstName,
      firstNameAr,
      lastName,
      lastNameAr,
      email: receptionist.email || '',
      phoneNumber: receptionist.phoneNumber || receptionist.phone_number || '',
      bio: receptionist.bio || '',
      bioAr: receptionist.bioAr || receptionist.bio_ar || '',
      profilePhotoUrl: profilePictureUrl,
      profilePictureUrl: profilePictureUrl,
      assignedDoctorId: receptionist.assignedDoctorId || receptionist.assigned_doctor_id || null,
      isActive: receptionist.isActive ?? receptionist.is_active ?? false,
      emailVerified: receptionist.emailVerified ?? receptionist.email_verified ?? false,
      createdAt: receptionist.createdAt || receptionist.created_at || null,
      updatedAt: receptionist.updatedAt || receptionist.updated_at || null,
      location: receptionist.location || '',
      locationAr: receptionist.locationAr || receptionist.location_ar || '',
      locationFr: receptionist.locationFr || receptionist.location_fr || '',
      role: 'receptionist',
      status: (receptionist.isActive ?? receptionist.is_active) ? 'active' : 'inactive',
      fullName: displayFullName,
      name: displayFullName,
      initials: staffUtils.generateInitials(displayFirstName, displayLastName),
      lastActive: receptionist.lastActive || null,
      permissions: receptionist.permissions || [],
      workSchedule: receptionist.workSchedule || [],
      joiningDate: receptionist.createdAt,
      experienceYears,
      experience: experienceYears,
      experiences: receptionist.experiences || [],
      contactInfo: {
        email: receptionist.email,
        phone: receptionist.phoneNumber,
        verified: receptionist.emailVerified ?? receptionist.email_verified
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

  async fetchDoctorStaffEmploymentHistory(doctorId) {
    return this.handleApiCall(async () => {
      return await this.axiosInstance.get(`/api/v1/doctor/staff/${doctorId}/history`);
    }, 'fetch staff employment history').then(data => {
      return data.history || [];
    });
  }

  async fetchStaffById(staffId) {
    return this.handleApiCall(async () => {
      return await this.axiosInstance.get(`/api/v1/receptionist/${staffId}`);
    }, 'fetch staff member').then(data => {
      return this.transformReceptionistData(data.receptionist || data);
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

  async fetchDoctorHiringProposals() {
    return this.handleApiCall(async () => {
      return await this.axiosInstance.get('/api/v1/doctor/hiring-proposals');
    }, 'fetch doctor hiring proposals').then(data => {
      return data.proposals || [];
    });
  }

  async hireReceptionist(receptionistId, doctorId, contractDetails = {}) {
    return this.handleApiCall(async () => {
      const payload = {
        receptionistId: receptionistId,
        message: contractDetails.message || null
      };

      const response = await this.axiosInstance.post('/api/v1/doctor/hire-receptionist', payload);
      return response.data?.proposal || null;
    }, 'hire receptionist');
  }

  async dismissReceptionist(receptionistId, reason = '') {
    return this.handleApiCall(async () => {
      const payload = { reason };
      const response = await this.axiosInstance.post(`/api/v1/doctor/dismiss-receptionist/${receptionistId}`, payload);
      return response.data;
    }, 'dismiss receptionist');
  }

  async updateStaffProfile(staffId, profileData) {
    return this.handleApiCall(async () => {
      const transformedData = staffUtils.transformProfileDataForApi(profileData);
      await this.axiosInstance.put(`/api/v1/receptionist/${staffId}`, transformedData);
      const response = await this.axiosInstance.get(`/api/v1/receptionist/${staffId}`);
      return this.transformReceptionistData(response.data.receptionist || response.data);
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

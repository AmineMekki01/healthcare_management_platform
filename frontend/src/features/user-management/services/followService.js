import axiosInstance from '../../../components/axiosConfig';

class FollowService {
  constructor() {
    this.axiosInstance = axiosInstance;
    this.apiBaseUrl = '/api/v1';
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

  async followDoctor(doctorId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.post(`${this.apiBaseUrl}/follow-doctor/${doctorId}`);
      return response;
    }, 'follow doctor');
  }

  async unfollowDoctor(doctorId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.delete(`${this.apiBaseUrl}/unfollow-doctor/${doctorId}`);
      return response;
    }, 'unfollow doctor');
  }


  async isFollowingDoctor(doctorId, followerId, followerType) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`${this.apiBaseUrl}/is-following/${doctorId}`, {
        params: {
          followerId: followerId,
          followerType: followerType
        }
      });
      return response;
    }, 'check follow status');
  }


  async getDoctorFollowerCount(doctorId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`${this.apiBaseUrl}/doctor-follow-count/${doctorId}`);
      return response;
    }, 'get follower count');
  }


  async getDoctorFollowers(doctorId, pagination = {}) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`${this.apiBaseUrl}/doctor-followers/${doctorId}`, {
        params: {
          page: pagination.page || 1,
          limit: pagination.limit || 20
        }
      });
      return response;
    }, 'get doctor followers');
  }


  async getUserFollowing(userId, userType, pagination = {}) {
    return this.handleApiCall(async () => {
      let endpoint;
      if (userType === 'patient') {
        endpoint = `${this.apiBaseUrl}/patient-followings/${userId}`;
      } else {
        endpoint = `${this.apiBaseUrl}/user-followings/${userId}`;
      }

      const response = await this.axiosInstance.get(endpoint, {
        params: {
          user_type: userType,
          page: pagination.page || 1,
          limit: pagination.limit || 20
        }
      });
      return response;
    }, 'get user following');
  }

  async getFollowStats(doctorId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`${this.apiBaseUrl}/doctor-follow-stats/${doctorId}`);
      return response;
    }, 'get follow statistics');
  }

  async getFollowSuggestions(userId, userType, filters = {}) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`${this.apiBaseUrl}/follow-suggestions`, {
        params: {
          user_id: userId,
          user_type: userType,
          specialization: filters.specialization,
          location: filters.location,
          limit: filters.limit || 10
        }
      });
      return response;
    }, 'get follow suggestions');
  }

  async getMutualFollows(userId1, userId2) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`${this.apiBaseUrl}/mutual-follows`, {
        params: {
          user_id_1: userId1,
          user_id_2: userId2
        }
      });
      return response;
    }, 'get mutual follows');
  }

  async bulkFollowDoctors(doctorIds, followerId, followerType) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.post(`${this.apiBaseUrl}/bulk-follow-doctors`, {
        doctor_ids: doctorIds,
        follower_id: followerId,
        follower_type: followerType
      });
      return response;
    }, 'bulk follow doctors');
  }

  async bulkUnfollowDoctors(doctorIds, userId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.post(`${this.apiBaseUrl}/bulk-unfollow-doctors`, {
        doctor_ids: doctorIds,
        user_id: userId
      });
      return response;
    }, 'bulk unfollow doctors');
  }

  async getFollowActivity(userId, pagination = {}) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`${this.apiBaseUrl}/follow-activity/${userId}`, {
        params: {
          page: pagination.page || 1,
          limit: pagination.limit || 20,
          time_range: pagination.timeRange || '30d'
        }
      });
      return response;
    }, 'get follow activity');
  }

  async searchDoctorsToFollow(userId, searchQuery, filters = {}) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`${this.apiBaseUrl}/search-doctors-follow`, {
        params: {
          user_id: userId,
          query: searchQuery,
          specialization: filters.specialization,
          location: filters.location,
          rating: filters.rating,
          page: filters.page || 1,
          limit: filters.limit || 20
        }
      });
      return response;
    }, 'search doctors to follow');
  }

  async getFollowNotifications(userId, pagination = {}) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`${this.apiBaseUrl}/follow-notifications/${userId}`, {
        params: {
          page: pagination.page || 1,
          limit: pagination.limit || 20,
          unread_only: pagination.unreadOnly || false
        }
      });
      return response;
    }, 'get follow notifications');
  }

  async markFollowNotificationRead(notificationId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.put(`${this.apiBaseUrl}/follow-notifications/read/${notificationId}`);
      return response;
    }, 'mark follow notification read');
  }

  async updateFollowPreferences(userId, preferences) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.put(`${this.apiBaseUrl}/follow-preferences/${userId}`, {
        email_notifications: preferences.emailNotifications,
        push_notifications: preferences.pushNotifications,
        activity_visibility: preferences.activityVisibility,
        follow_suggestions: preferences.followSuggestions
      });
      return response;
    }, 'update follow preferences');
  }

  async getFollowPreferences(userId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`${this.apiBaseUrl}/follow-preferences/${userId}`);
      return response;
    }, 'get follow preferences');
  }

  async reportFollowBehavior(reportData) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.post(`${this.apiBaseUrl}/report-follow-behavior`, {
        reported_user_id: reportData.reportedUserId,
        reporter_user_id: reportData.reporterUserId,
        reason: reportData.reason,
        description: reportData.description,
        evidence: reportData.evidence
      });
      return response;
    }, 'report follow behavior');
  }

  async blockUserFromFollowing(blockedUserId, blockerUserId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.post(`${this.apiBaseUrl}/block-follow`, {
        blocked_user_id: blockedUserId,
        blocker_user_id: blockerUserId
      });
      return response;
    }, 'block user from following');
  }

  async unblockUserFromFollowing(blockedUserId, blockerUserId) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.delete(`${this.apiBaseUrl}/unblock-follow`, {
        data: {
          blocked_user_id: blockedUserId,
          blocker_user_id: blockerUserId
        }
      });
      return response;
    }, 'unblock user from following');
  }

  async getBlockedUsers(userId, pagination = {}) {
    return this.handleApiCall(async () => {
      const response = await this.axiosInstance.get(`${this.apiBaseUrl}/blocked-users/${userId}`, {
        params: {
          page: pagination.page || 1,
          limit: pagination.limit || 20
        }
      });
      return response;
    }, 'get blocked users');
  }
}

export const followService = new FollowService();
export default followService;

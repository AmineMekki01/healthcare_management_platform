import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { userService } from '../services';
import { userUtils } from '../utils';

export const useUserManagement = (userId = null, userType = null, options = {}) => {
  const { t } = useTranslation('userManagement');
  const [state, setState] = useState({
    user: null,
    users: [],
    filteredUsers: [],
    searchResults: [],
    userStats: null,
    notifications: [],
    messages: [],
    appointments: [],
    loading: {
      user: false,
      users: false,
      update: false,
      delete: false,
      upload: false,
      stats: false,
      search: false
    },
    error: {
      user: null,
      users: null,
      update: null,
      delete: null,
      upload: null,
      stats: null,
      search: null
    },
    filters: {
      searchTerm: '',
      userType: 'all',
      status: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    },
    validation: {
      errors: {},
      isValid: true
    },
    pagination: {
      current: 1,
      size: 20,
      total: 0,
      totalPages: 0
    }
  });

  const setLoading = useCallback((operation, isLoading) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [operation]: isLoading }
    }));
  }, []);

  const setError = useCallback((operation, error) => {
    setState(prev => ({
      ...prev,
      error: { ...prev.error, [operation]: error }
    }));
  }, []);

  const clearError = useCallback((operation = null) => {
    setState(prev => ({
      ...prev,
      error: operation 
        ? { ...prev.error, [operation]: null }
        : { user: null, users: null, update: null, delete: null, upload: null, stats: null, search: null }
    }));
  }, []);

  const fetchUser = useCallback(async (id = userId, type = userType, includeStats = false) => {
    if (!id || !type) return;
    
    setLoading('user', true);
    clearError('user');
    console.log(`Fetching user: ${id}, type: ${type}`);
    try {
      const userData = await userService.getUserProfile(id, type);
      console.log('User data:', userData);
      let userStats = null;
      if (includeStats) {
        try {
          userStats = await userService.getUserStats(id, type);
        } catch (statsError) {
          console.warn('Failed to fetch user stats:', statsError);
        }
      }

      setState(prev => ({
        ...prev,
        user: userData,
        userStats
      }));

      return userData;
    } catch (err) {
      const errorMessage = err.message || t('hooks.errors.fetchUser');
      setError('user', errorMessage);
      throw err;
    } finally {
      setLoading('user', false);
    }
  }, [userId, userType, setLoading, clearError, setError, t]);


  const fetchUsersByType = useCallback(async (type, filters = {}, pagination = {}) => {
    setLoading('users', true);
    clearError('users');
    
    try {
      const apiFilters = {
        ...filters,
        page: pagination.page || 1,
        limit: pagination.limit || 20
      };

      const response = await userService.getUsersByType(type, apiFilters);
      const usersData = Array.isArray(response) ? response : response.users || [];
      
      setState(prev => ({
        ...prev,
        users: usersData,
        filteredUsers: usersData,
        pagination: {
          ...prev.pagination,
          total: response.total || usersData.length,
          totalPages: response.totalPages || Math.ceil((response.total || usersData.length) / (pagination.limit || 20))
        }
      }));

      return usersData;
    } catch (err) {
      const errorMessage = err.message || t('hooks.errors.fetchUsers', { type });
      setError('users', errorMessage);
      throw err;
    } finally {
      setLoading('users', false);
    }
  }, [setLoading, clearError, setError, t]);

  const updateUser = useCallback(async (id, type, profileData) => {
    setLoading('update', true);
    clearError('update');
    
    try {
      const validation = userUtils.validateUserProfile(profileData, type);
      
      setState(prev => ({
        ...prev,
        validation
      }));

      if (!validation.isValid) {
        throw new Error(t('hooks.errors.validationErrors'));
      }

      const updatedUser = await userService.updateUserProfile(id, type, profileData);
      
      setState(prev => ({
        ...prev,
        user: prev.user?.id === id ? updatedUser : prev.user,
        users: prev.users.map(u => u.id === id ? updatedUser : u),
        filteredUsers: prev.filteredUsers.map(u => u.id === id ? updatedUser : u),
        validation: { errors: {}, isValid: true }
      }));
      
      return updatedUser;
    } catch (err) {
      const errorMessage = err.message || t('hooks.errors.updateUser');
      setError('update', errorMessage);
      throw err;
    } finally {
      setLoading('update', false);
    }
  }, [setLoading, clearError, setError, t]);


  const searchUsers = useCallback(async (searchCriteria, useLocalSearch = false) => {
    setLoading('search', true);
    clearError('search');
    
    try {
      let results;
      
      if (useLocalSearch && state.users.length > 0) {
        results = userUtils.filtering.filterUsersBySearch(state.users, searchCriteria.query);
      } else {
        results = await userService.searchUsers(searchCriteria);
      }
      
      setState(prev => ({
        ...prev,
        searchResults: results,
        filteredUsers: results
      }));

      return results;
    } catch (err) {
      const errorMessage = err.message || t('hooks.errors.searchUsers');
      setError('search', errorMessage);
      throw err;
    } finally {
      setLoading('search', false);
    }
  }, [state.users, setLoading, clearError, setError, t]);


  const uploadUserImage = useCallback(async (id, type, imageFile, onProgress = null) => {
    setLoading('upload', true);
    clearError('upload');
    
    try {
      const newImageUrl = await userService.uploadUserImage(id, type, imageFile, onProgress);
      
      setState(prev => ({
        ...prev,
        user: prev.user?.id === id ? { ...prev.user, profilePhotoUrl: newImageUrl } : prev.user,
        users: prev.users.map(u => u.id === id ? { ...u, profilePhotoUrl: newImageUrl } : u),
        filteredUsers: prev.filteredUsers.map(u => u.id === id ? { ...u, profilePhotoUrl: newImageUrl } : u)
      }));
      
      return newImageUrl;
    } catch (err) {
      const errorMessage = err.message || t('hooks.errors.uploadImage');
      setError('upload', errorMessage);
      throw err;
    } finally {
      setLoading('upload', false);
    }
  }, [setLoading, clearError, setError, t]);

  /**
   * Toggle user status with confirmation
   */
  const toggleUserStatus = useCallback(async (id, type, isActive) => {
    setLoading('update', true);
    clearError('update');
    
    try {
      const updatedUser = await userService.toggleUserStatus(id, type, isActive);
      
      setState(prev => ({
        ...prev,
        user: prev.user?.id === id ? updatedUser : prev.user,
        users: prev.users.map(u => u.id === id ? updatedUser : u),
        filteredUsers: prev.filteredUsers.map(u => u.id === id ? updatedUser : u)
      }));
      
      return updatedUser;
    } catch (err) {
      const errorMessage = err.message || t('hooks.errors.toggleStatus');
      setError('update', errorMessage);
      throw err;
    } finally {
      setLoading('update', false);
    }
  }, [setLoading, clearError, setError, t]);

  /**
   * Delete user with confirmation
   */
  const deleteUser = useCallback(async (id, type) => {
    setLoading('delete', true);
    clearError('delete');
    
    try {
      await userService.deleteUser(id, type);
      
      setState(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== id),
        filteredUsers: prev.filteredUsers.filter(u => u.id !== id),
        user: prev.user?.id === id ? null : prev.user
      }));
      
      return true;
    } catch (err) {
      const errorMessage = err.message || t('hooks.errors.deleteUser');
      setError('delete', errorMessage);
      throw err;
    } finally {
      setLoading('delete', false);
    }
  }, [setLoading, clearError, setError, t]);


  const updateFilters = useCallback((newFilters) => {
    setState(prev => {
      const updatedFilters = { ...prev.filters, ...newFilters };
      let filtered = [...prev.users];

      if (updatedFilters.searchTerm) {
        filtered = userUtils.filtering.filterUsersBySearch(filtered, updatedFilters.searchTerm);
      }

      if (updatedFilters.userType !== 'all') {
        filtered = userUtils.filtering.filterUsersByType(filtered, updatedFilters.userType);
      }

      if (updatedFilters.status !== 'all') {
        filtered = userUtils.filtering.filterUsersByStatus(filtered, updatedFilters.status);
      }

      filtered = userUtils.filtering.sortUsers(filtered, updatedFilters.sortBy, updatedFilters.sortOrder);

      return {
        ...prev,
        filters: updatedFilters,
        filteredUsers: filtered
      };
    });
  }, []);

  const fetchUserStats = useCallback(async (id, type, timeRange = '30d') => {
    setLoading('stats', true);
    clearError('stats');
    
    try {
      const stats = await userService.getUserStats(id, type, timeRange);
      
      setState(prev => ({
        ...prev,
        userStats: stats
      }));
      
      return stats;
    } catch (err) {
      const errorMessage = err.message || t('hooks.errors.fetchStats');
      setError('stats', errorMessage);
      throw err;
    } finally {
      setLoading('stats', false);
    }
  }, [setLoading, clearError, setError, t]);

  const fetchUserNotifications = useCallback(async (id, page = 1, limit = 20) => {
    try {
      const response = await userService.getUserNotifications(id, page, limit);
      
      setState(prev => ({
        ...prev,
        notifications: response.notifications
      }));
      
      return response;
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
      return { notifications: [], pagination: {} };
    }
  }, []);

  const fetchUserMessages = useCallback(async (id, page = 1, limit = 50) => {
    try {
      const response = await userService.getUserMessages(id, page, limit);
      
      setState(prev => ({
        ...prev,
        messages: response.messages
      }));
      
      return response;
    } catch (err) {
      console.warn('Failed to fetch messages:', err);
      return { messages: [], pagination: {} };
    }
  }, []);

  const fetchUserAppointments = useCallback(async (filters = {}) => {
    try {
      const appointments = await userService.getUserAppointments(filters);
      
      setState(prev => ({
        ...prev,
        appointments: Array.isArray(appointments) ? appointments : []
      }));
      
      return appointments;
    } catch (err) {
      console.warn('Failed to fetch appointments:', err);
      return [];
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      user: null,
      users: [],
      filteredUsers: [],
      searchResults: [],
      userStats: null,
      notifications: [],
      messages: [],
      appointments: [],
      loading: {
        user: false,
        users: false,
        update: false,
        delete: false,
        upload: false,
        stats: false,
        search: false
      },
      error: {
        user: null,
        users: null,
        update: null,
        delete: null,
        upload: null,
        stats: null,
        search: null
      },
      filters: {
        searchTerm: '',
        userType: 'all',
        status: 'all',
        sortBy: 'name',
        sortOrder: 'asc'
      },
      validation: {
        errors: {},
        isValid: true
      },
      pagination: {
        current: 1,
        size: 20,
        total: 0,
        totalPages: 0
      }
    });
  }, []);

  const computedValues = useMemo(() => ({
    hasUser: !!state.user,
    hasUsers: state.users.length > 0,
    hasFilteredUsers: state.filteredUsers.length > 0,
    hasSearchResults: state.searchResults.length > 0,
    hasStats: !!state.userStats,
    hasNotifications: state.notifications.length > 0,
    hasMessages: state.messages.length > 0,
    hasAppointments: state.appointments.length > 0,

    isLoading: Object.values(state.loading).some(loading => loading),
    isUserLoading: state.loading.user,
    isUsersLoading: state.loading.users,
    isUpdating: state.loading.update,
    isDeleting: state.loading.delete,
    isUploading: state.loading.upload,
    isStatsLoading: state.loading.stats,
    isSearching: state.loading.search,

    hasErrors: Object.values(state.error).some(error => error),
    hasUserError: !!state.error.user,
    hasUsersError: !!state.error.users,
    hasUpdateError: !!state.error.update,
    hasDeleteError: !!state.error.delete,
    hasUploadError: !!state.error.upload,
    hasStatsError: !!state.error.stats,
    hasSearchError: !!state.error.search,

    hasValidationErrors: Object.keys(state.validation.errors).length > 0,
    isFormValid: state.validation.isValid,

    userDisplayName: state.user ? userUtils.formatFullName(state.user.firstName, state.user.lastName) : '',
    userInitials: state.user ? userUtils.generateInitials(state.user.firstName, state.user.lastName) : '',
    userAvatar: state.user ? userUtils.getUserAvatar(state.user) : null,
    userStatusBadge: state.user ? userUtils.getUserStatusBadge(state.user) : null,
    userTypeBadge: state.user ? userUtils.getUserTypeBadge(state.user.userType) : null,

    totalUsers: state.users.length,
    totalFilteredUsers: state.filteredUsers.length,
    activeUsers: state.users.filter(u => u.isActive).length,
    inactiveUsers: state.users.filter(u => !u.isActive).length,

    filterOptions: userUtils.filtering.getFilterOptions(state.users)
  }), [state]);

  useEffect(() => {
    if (userId && userType && options.autoFetch !== false) {
      fetchUser(userId, userType, options.includeStats);
    }
  }, [fetchUser, userId, userType, options.autoFetch, options.includeStats]);

  useEffect(() => {
    if (state.users.length > 0) {
      updateFilters({});
    }
  }, [state.users, updateFilters]);

  return {
    user: state.user,
    users: state.users,
    filteredUsers: state.filteredUsers,
    searchResults: state.searchResults,
    userStats: state.userStats,
    notifications: state.notifications,
    messages: state.messages,
    appointments: state.appointments,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    validation: state.validation,
    pagination: state.pagination,
    
    fetchUser,
    fetchUsersByType,
    updateUser,
    searchUsers,
    uploadUserImage,
    toggleUserStatus,
    deleteUser,
    updateFilters,
    fetchUserStats,
    fetchUserNotifications,
    fetchUserMessages,
    fetchUserAppointments,
    clearError,
    reset,
    
    ...computedValues
  };
};

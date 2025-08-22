import { useState, useEffect, useCallback, useMemo } from 'react';
import { followService } from '../services';

/**
 * Enhanced hook for managing doctor following functionality
 * @param {string} doctorId - ID of the doctor
 * @param {Object} currentUser - Current user object
 * @param {Object} options - Additional configuration options
 */
export const useFollow = (doctorId, currentUser, options = {}) => {
  const [state, setState] = useState({
    isFollowing: false,
    followerCount: 0,
    followers: [],
    following: [],
    loading: {
      check: false,
      follow: false,
      unfollow: false,
      followers: false,
      following: false
    },
    error: {
      check: null,
      follow: null,
      unfollow: null,
      followers: null,
      following: null
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
        : { check: null, follow: null, unfollow: null, followers: null, following: null }
    }));
  }, []);

  const checkFollowStatus = useCallback(async () => {
    if (!doctorId || !currentUser?.userId) return;
    
    setLoading('check', true);
    clearError('check');
    
    try {
      const followResponse = await followService.isFollowingDoctor(
        doctorId, 
        currentUser.userId, 
        currentUser.userType
      );
      console.log("followResponse :", followResponse);  
      
      const countResponse = await followService.getDoctorFollowerCount(doctorId);
      
      setState(prev => ({
        ...prev,
        isFollowing: followResponse.isFollowing || false,
        followerCount: countResponse.followerCount || 0
      }));
      
    } catch (err) {
      console.error('Error checking follow status:', err);
      const errorMessage = err.message || 'Failed to check follow status';
      setError('check', errorMessage);
      
      setState(prev => ({
        ...prev,
        isFollowing: false,
        followerCount: 0
      }));
    } finally {
      setLoading('check', false);
    }
  }, [doctorId, currentUser?.userId, currentUser?.userType, setLoading, clearError, setError]);

  const followDoctor = useCallback(async () => {
    if (!currentUser?.userId || !doctorId) {
      setError('follow', 'User must be logged in to follow doctors');
      return;
    }

    if (state.isFollowing) {
      console.warn('Already following this doctor');
      return;
    }

    setLoading('follow', true);
    clearError('follow');
    
    try {
      await followService.followDoctor(
        doctorId, 
        currentUser.userId, 
        currentUser.userType
      );
      
      setState(prev => ({
        ...prev,
        isFollowing: true,
        followerCount: prev.followerCount + 1
      }));
      
      if (options.onFollow) {
        options.onFollow(doctorId, currentUser);
      }
      
    } catch (err) {
      console.error('Error following doctor:', err);
      const errorMessage = err.message || 'Failed to follow doctor';
      setError('follow', errorMessage);
      throw err;
    } finally {
      setLoading('follow', false);
    }
  }, [doctorId, currentUser, state.isFollowing, setLoading, clearError, setError, options]);

  const unfollowDoctor = useCallback(async () => {
    if (!currentUser?.userId || !doctorId) {
      setError('unfollow', 'User must be logged in to unfollow doctors');
      return;
    }

    if (!state.isFollowing) {
      console.warn('Not following this doctor');
      return;
    }

    setLoading('unfollow', true);
    clearError('unfollow');
    
    try {
      await followService.unfollowDoctor(doctorId, currentUser.userId);
      
      setState(prev => ({
        ...prev,
        isFollowing: false,
        followerCount: Math.max(0, prev.followerCount - 1)
      }));
      
      if (options.onUnfollow) {
        options.onUnfollow(doctorId, currentUser);
      }
      
    } catch (err) {
      console.error('Error unfollowing doctor:', err);
      const errorMessage = err.message || 'Failed to unfollow doctor';
      setError('unfollow', errorMessage);
      throw err;
    } finally {
      setLoading('unfollow', false);
    }
  }, [doctorId, currentUser, state.isFollowing, setLoading, clearError, setError, options]);

  const toggleFollow = useCallback(async () => {
    try {
      if (state.isFollowing) {
        await unfollowDoctor();
      } else {
        await followDoctor();
      }
    } catch (err) {
      console.error('Error toggling follow status:', err);
    }
  }, [state.isFollowing, followDoctor, unfollowDoctor]);

  
  const getDoctorFollowers = useCallback(async (page = 1, limit = 20) => {
    if (!doctorId) return;
    
    setLoading('followers', true);
    clearError('followers');
    
    try {
      const response = await followService.getDoctorFollowers(doctorId, { page, limit });
      
      setState(prev => ({
        ...prev,
        followers: response.followers || []
      }));
      
      return response;
    } catch (err) {
      console.error('Error fetching followers:', err);
      const errorMessage = err.message || 'Failed to fetch followers';
      setError('followers', errorMessage);
      return { followers: [], pagination: {} };
    } finally {
      setLoading('followers', false);
    }
  }, [doctorId, setLoading, clearError, setError]);

  const getUserFollowing = useCallback(async (page = 1, limit = 20) => {
    if (!currentUser?.userId) return;
    
    setLoading('following', true);
    clearError('following');
    
    try {
      const response = await followService.getUserFollowing(
        currentUser.userId, 
        currentUser.userType, 
        { page, limit }
      );
      
      setState(prev => ({
        ...prev,
        following: response.following || []
      }));
      
      return response;
    } catch (err) {
      console.error('Error fetching following list:', err);
      const errorMessage = err.message || 'Failed to fetch following list';
      setError('following', errorMessage);
      return { following: [], pagination: {} };
    } finally {
      setLoading('following', false);
    }
  }, [currentUser?.userId, currentUser?.userType, setLoading, clearError, setError]);

  const getFollowStats = useCallback(async () => {
    if (!doctorId) return null;
    
    try {
      const stats = await followService.getFollowStats(doctorId);
      return stats;
    } catch (err) {
      console.error('Error fetching follow stats:', err);
      return null;
    }
  }, [doctorId]);


  const bulkFollowDoctors = useCallback(async (doctorIds) => {
    if (!currentUser?.userId || !Array.isArray(doctorIds)) return;
    
    const results = [];
    
    for (const id of doctorIds) {
      try {
        await followService.followDoctor(id, currentUser.userId, currentUser.userType);
        results.push({ doctorId: id, success: true });
      } catch (err) {
        results.push({ doctorId: id, success: false, error: err.message });
      }
    }
    
    return results;
  }, [currentUser?.userId, currentUser?.userType]);

  const bulkUnfollowDoctors = useCallback(async (doctorIds) => {
    if (!currentUser?.userId || !Array.isArray(doctorIds)) return;
    
    const results = [];
    
    for (const id of doctorIds) {
      try {
        await followService.unfollowDoctor(id, currentUser.userId);
        results.push({ doctorId: id, success: true });
      } catch (err) {
        results.push({ doctorId: id, success: false, error: err.message });
      }
    }
    
    return results;
  }, [currentUser?.userId]);

  const computedValues = useMemo(() => ({
    isLoading: Object.values(state.loading).some(loading => loading),
    isCheckingStatus: state.loading.check,
    isFollowingInProgress: state.loading.follow,
    isUnfollowingInProgress: state.loading.unfollow,
    isLoadingFollowers: state.loading.followers,
    isLoadingFollowing: state.loading.following,
    hasErrors: Object.values(state.error).some(error => error),
    hasCheckError: !!state.error.check,
    hasFollowError: !!state.error.follow,
    hasUnfollowError: !!state.error.unfollow,
    hasFollowersError: !!state.error.followers,
    hasFollowingError: !!state.error.following,
    hasFollowers: state.followers.length > 0,
    hasFollowing: state.following.length > 0,
    canFollow: !!currentUser?.userId && currentUser.userId !== doctorId && currentUser.userType !== 'doctor',
    canViewFollowers: !!doctorId,
    canViewFollowing: !!currentUser?.userId,
    followerCountText: state.followerCount === 1 ? '1 follower' : `${state.followerCount} followers`,
    followButtonText: state.isFollowing ? 'Unfollow' : 'Follow',
    followButtonDisabled: state.loading.follow || state.loading.unfollow || !currentUser?.userId
  }), [state, currentUser, doctorId]);

  useEffect(() => {
    if (options.autoCheck !== false) {
      checkFollowStatus();
    }
  }, [checkFollowStatus, options.autoCheck]);

  useEffect(() => {
    if (options.autoFetchFollowers && doctorId) {
      getDoctorFollowers();
    }
  }, [getDoctorFollowers, options.autoFetchFollowers, doctorId]);

  useEffect(() => {
    if (options.autoFetchFollowing && currentUser?.userId) {
      getUserFollowing();
    }
  }, [getUserFollowing, options.autoFetchFollowing, currentUser?.userId]);

  return {
    isFollowing: state.isFollowing,
    followerCount: state.followerCount,
    followers: state.followers,
    following: state.following,
    loading: state.loading,
    error: state.error,
    followDoctor,
    unfollowDoctor,
    toggleFollow,
    getDoctorFollowers,
    getUserFollowing,
    getFollowStats,
    bulkFollowDoctors,
    bulkUnfollowDoctors,
    checkFollowStatus,
    clearError,
    ...computedValues
  };
};

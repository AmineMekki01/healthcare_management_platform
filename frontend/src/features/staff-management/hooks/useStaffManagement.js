import { useState, useCallback, useContext, useMemo, useEffect } from 'react';
import { staffService } from '../services';
import { staffUtils } from '../utils';
import { AuthContext } from './../../auth/context/AuthContext';

const useStaffManagement = () => {
  const [receptionists, setReceptionists] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [talentPool, setTalentPool] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [workSchedule, setWorkSchedule] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [performance, setPerformance] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [staffHistory, setStaffHistory] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const { user: currentUser } = useContext(AuthContext) || {};

  const getCurrentDoctorId = useCallback(() => {
    return currentUser?.id || localStorage.getItem('userId') || '';
  }, [currentUser]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error, operation) => {
    console.error(`Error in ${operation}:`, error);
    const errorMessage = error?.message || `Failed to ${operation}`;
    setError(errorMessage);
  }, []);

  const filteredStaff = useMemo(() => {
    return receptionists.filter(staff => staff && staff.id);
  }, [receptionists]);

  const staffStatistics = useMemo(() => {
    return staffUtils.getStaffStatistics(filteredStaff);
  }, [filteredStaff]);

  const isStaffSelected = useCallback((staffId) => {
    return selectedStaff?.id === staffId;
  }, [selectedStaff]);

  const getStaffById = useCallback((staffId) => {
    return receptionists.find(staff => staff.id === staffId);
  }, [receptionists]);

  const fetchStaff = useCallback(async (doctorId = null) => {
    try {
      setLoading(true);
      clearError();
      const currentDoctorId = doctorId || getCurrentDoctorId();
      
      if (!currentDoctorId) {
        throw new Error('Doctor ID is required to fetch staff');
      }

      const staff = await staffService.fetchStaff(currentDoctorId);
      console.log('Final Fetched staff:', staff);
      setReceptionists(Array.isArray(staff) ? staff : []);
      return staff;
    } catch (error) {
      handleError(error, 'fetch staff');
      setReceptionists([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, getCurrentDoctorId]);

  const fetchStaffById = useCallback(async (staffId) => {
    try {
      setLoading(true);
      clearError();
      const staff = await staffService.fetchStaffById(staffId);
      setSelectedStaff(staff);
      return staff;
    } catch (error) {
      handleError(error, 'fetch staff member');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  const searchStaff = useCallback(async (query, filters = {}) => {
    try {
      setLoading(true);
      clearError();
      
      if (!query && Object.keys(filters).length === 0) {
        setSearchResults([]);
        return [];
      }

      const results = await staffService.searchStaff(query, filters);
      setSearchResults(Array.isArray(results) ? results : []);
      return results;
    } catch (error) {
      handleError(error, 'search staff');
      setSearchResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  const fetchTalentPool = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      clearError();
      
      const pool = await staffService.fetchTalentPool(filters);
      setTalentPool(Array.isArray(pool) ? pool : []);
      return pool;
    } catch (error) {
      handleError(error, 'fetch talent pool');
      setTalentPool([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  const hireReceptionist = useCallback(async (receptionistId, contractDetails = {}, doctorId = null) => {
    try {
      setLoading(true);
      clearError();
      const currentDoctorId = doctorId || getCurrentDoctorId();
      
      const hired = await staffService.hireReceptionist(receptionistId, currentDoctorId, contractDetails);
      
      if (hired) {
        setReceptionists(prev => [...prev, hired]);
        setTalentPool(prev => prev.filter(r => r.id !== receptionistId));
      }
      
      return hired;
    } catch (error) {
      handleError(error, 'hire receptionist');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, getCurrentDoctorId]);

  const dismissReceptionist = useCallback(async (receptionistId, reason = '') => {
    try {
      setLoading(true);
      clearError();
      
      await staffService.dismissReceptionist(receptionistId, reason);
      
      setReceptionists(prev => prev.filter(r => r.id !== receptionistId));
      if (selectedStaff?.id === receptionistId) {
        setSelectedStaff(null);
      }
      
      return true;
    } catch (error) {
      handleError(error, 'dismiss receptionist');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, selectedStaff]);

  const activateReceptionist = useCallback(async (receptionistId) => {
    try {
      setLoading(true);
      clearError();
      
      const activated = await staffService.activateReceptionist(receptionistId);
      
      if (activated) {
        setReceptionists(prev => 
          prev.map(r => r.id === receptionistId ? activated : r)
        );
        if (selectedStaff?.id === receptionistId) {
          setSelectedStaff(activated);
        }
      }
      
      return activated;
    } catch (error) {
      handleError(error, 'activate receptionist');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, selectedStaff]);

  const deactivateReceptionist = useCallback(async (receptionistId) => {
    try {
      setLoading(true);
      clearError();
      
      const deactivated = await staffService.deactivateReceptionist(receptionistId);
      
      if (deactivated) {
        setReceptionists(prev => 
          prev.map(r => r.id === receptionistId ? deactivated : r)
        );
        if (selectedStaff?.id === receptionistId) {
          setSelectedStaff(deactivated);
        }
      }
      
      return deactivated;
    } catch (error) {
      handleError(error, 'deactivate receptionist');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, selectedStaff]);

  const updateStaffProfile = useCallback(async (staffId, profileData) => {
    try {
      setLoading(true);
      clearError();
      
      const updated = await staffService.updateStaffProfile(staffId, profileData);
      
      if (updated) {
        setReceptionists(prev => 
          prev.map(r => r.id === staffId ? updated : r)
        );
        if (selectedStaff?.id === staffId) {
          setSelectedStaff(updated);
        }
        setUnsavedChanges(false);
      }
      
      return updated;
    } catch (error) {
      handleError(error, 'update staff profile');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, selectedStaff]);

  const updateStaffPermissions = useCallback(async (staffId, permissions) => {
    try {
      setLoading(true);
      clearError();
      
      await staffService.updateStaffPermissions(staffId, permissions);
      
      setReceptionists(prev => 
        prev.map(r => r.id === staffId ? { ...r, permissions } : r)
      );
      if (selectedStaff?.id === staffId) {
        setSelectedStaff(prev => ({ ...prev, permissions }));
      }
      
      return true;
    } catch (error) {
      handleError(error, 'update staff permissions');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, selectedStaff]);

  const updateWorkSchedule = useCallback(async (staffId, schedule) => {
    try {
      setLoading(true);
      clearError();
      
      await staffService.updateWorkSchedule(staffId, schedule);
      
      setReceptionists(prev => 
        prev.map(r => r.id === staffId ? { ...r, workSchedule: schedule } : r)
      );
      if (selectedStaff?.id === staffId) {
        setSelectedStaff(prev => ({ ...prev, workSchedule: schedule }));
      }
      
      return true;
    } catch (error) {
      handleError(error, 'update work schedule');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, selectedStaff]);

  const fetchStaffStatistics = useCallback(async (doctorId = null, timeRange = '30d') => {
    try {
      setLoading(true);
      clearError();
      const currentDoctorId = doctorId || getCurrentDoctorId();
      
      const stats = await staffService.fetchStaffStatistics(currentDoctorId, timeRange);
      setStatistics(stats);
      return stats;
    } catch (error) {
      handleError(error, 'fetch staff statistics');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, getCurrentDoctorId]);

  const fetchStaffPerformance = useCallback(async (staffId, timeRange = '30d') => {
    try {
      setLoading(true);
      clearError();
      
      const performanceData = await staffService.fetchStaffPerformance(staffId, timeRange);
      setPerformance(prev => ({ ...prev, [staffId]: performanceData }));
      return performanceData;
    } catch (error) {
      handleError(error, 'fetch staff performance');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  const uploadProfilePhoto = useCallback(async (staffId, file, onProgress = null) => {
    try {
      setUploading(true);
      clearError();
      
      const photoUrl = await staffService.uploadProfilePhoto(staffId, file, onProgress);
      
      setReceptionists(prev => 
        prev.map(r => r.id === staffId ? { ...r, profilePhotoUrl: photoUrl } : r)
      );
      if (selectedStaff?.id === staffId) {
        setSelectedStaff(prev => ({ ...prev, profilePhotoUrl: photoUrl }));
      }
      
      return photoUrl;
    } catch (error) {
      handleError(error, 'upload profile photo');
      throw error;
    } finally {
      setUploading(false);
    }
  }, [handleError, clearError, selectedStaff]);

  const fetchStaffHistory = useCallback(async (staffId, page = 1, limit = 20) => {
    try {
      setLoading(true);
      clearError();
      
      const historyData = await staffService.fetchStaffHistory(staffId, page, limit);
      setStaffHistory(prev => ({
        ...prev,
        [staffId]: historyData
      }));
      return historyData;
    } catch (error) {
      handleError(error, 'fetch staff history');
      return { history: [], pagination: {} };
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  const inviteReceptionist = useCallback(async (inviteData) => {
    try {
      setLoading(true);
      clearError();
      
      const invitation = await staffService.inviteReceptionist(inviteData);
      setPendingInvitations(prev => [...prev, invitation]);
      return invitation;
    } catch (error) {
      handleError(error, 'invite receptionist');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError]);

  const fetchPendingInvitations = useCallback(async (doctorId = null) => {
    try {
      setLoading(true);
      clearError();
      const currentDoctorId = doctorId || getCurrentDoctorId();
      
      const invitations = await staffService.fetchPendingInvitations(currentDoctorId);
      setPendingInvitations(Array.isArray(invitations) ? invitations : []);
      return invitations;
    } catch (error) {
      handleError(error, 'fetch pending invitations');
      setPendingInvitations([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, getCurrentDoctorId]);

  const updateStaffStatus = useCallback(async (staffId, status, statusMessage = '') => {
    try {
      await staffService.updateStaffStatus(staffId, status, statusMessage);
      
      setReceptionists(prev => 
        prev.map(r => r.id === staffId ? { ...r, status } : r)
      );
      if (selectedStaff?.id === staffId) {
        setSelectedStaff(prev => ({ ...prev, status }));
      }
      
      return true;
    } catch (error) {
      handleError(error, 'update staff status');
      return false;
    }
  }, [handleError, selectedStaff]);

  const generateStaffReport = useCallback(async (doctorId = null, reportType = 'summary', filters = {}) => {
    try {
      setLoading(true);
      clearError();
      const currentDoctorId = doctorId || getCurrentDoctorId();
      
      const report = await staffService.generateStaffReport(currentDoctorId, reportType, filters);
      return report;
    } catch (error) {
      handleError(error, 'generate staff report');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, getCurrentDoctorId]);

  const exportStaffData = useCallback(async (doctorId = null, format = 'csv', filters = {}) => {
    try {
      setLoading(true);
      clearError();
      const currentDoctorId = doctorId || getCurrentDoctorId();
      
      const exportData = await staffService.exportStaffData(currentDoctorId, format, filters);
      return exportData;
    } catch (error) {
      handleError(error, 'export staff data');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, getCurrentDoctorId]);

  const markUnsavedChanges = useCallback((hasChanges = true) => {
    setUnsavedChanges(hasChanges);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);

  return {
    receptionists: filteredStaff,
    selectedStaff,
    searchResults,
    talentPool,
    permissions,
    workSchedule,
    statistics,
    performance,
    notifications,
    pendingInvitations,
    staffHistory,
    loading,
    uploading,
    error,
    unsavedChanges,
    staffStatistics,
    
    clearError,
    setSelectedStaff,
    markUnsavedChanges,
    isStaffSelected,
    getStaffById,
    
    fetchStaff,
    fetchStaffById,
    searchStaff,
    fetchTalentPool,
    hireReceptionist,
    dismissReceptionist,
    activateReceptionist,
    deactivateReceptionist,
    updateStaffProfile,
    updateStaffPermissions,
    updateWorkSchedule,
    fetchStaffStatistics,
    fetchStaffPerformance,
    uploadProfilePhoto,
    fetchStaffHistory,
    inviteReceptionist,
    fetchPendingInvitations,
    updateStaffStatus,
    generateStaffReport,
    exportStaffData
  };
};

export default useStaffManagement;

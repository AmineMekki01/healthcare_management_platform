import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { staffUtils } from '../utils';

const useStaffFilters = (initialStaff = []) => {
  const { t } = useTranslation('staff');
  const [activeFilters, setActiveFilters] = useState({});
  const [savedFilters, setSavedFilters] = useState([]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set(initialStaff.map(staff => staff.status).filter(Boolean));
    return Array.from(statuses).sort();
  }, [initialStaff]);

  const availableRoles = useMemo(() => {
    const roles = new Set(initialStaff.map(staff => staff.role).filter(Boolean));
    return Array.from(roles).sort();
  }, [initialStaff]);

  const filteredStaff = useMemo(() => {
    return applyFilters(initialStaff, activeFilters);
  }, [initialStaff, activeFilters, applyFilters]);

  const filterStats = useMemo(() => {
    const stats = {};
    
    availableStatuses.forEach(status => {
      stats[status] = initialStaff.filter(staff => staff.status === status).length;
    });
    
    return {
      total: initialStaff.length,
      filtered: filteredStaff.length,
      byStatus: stats
    };
  }, [initialStaff, filteredStaff, availableStatuses]);

  const applyFilters = useCallback((staff, filters) => {
    let result = [...staff];

    Object.entries(filters).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return;

      switch (key) {
        case 'status':
          if (Array.isArray(value)) {
            result = result.filter(s => value.includes(s.status));
          } else {
            result = result.filter(s => s.status === value);
          }
          break;

        case 'role':
          if (Array.isArray(value)) {
            result = result.filter(s => value.includes(s.role));
          } else {
            result = result.filter(s => s.role === value);
          }
          break;

        case 'experience':
          result = result.filter(s => {
            const exp = staffUtils.calculateExperience(s.createdAt);
            if (value === 'new') return exp.includes('month') || exp === 'Less than a month';
            if (value === 'experienced') return exp.includes('year');
            return true;
          });
          break;

        case 'verification':
          result = result.filter(s => {
            if (value === 'verified') return s.emailVerified;
            if (value === 'unverified') return !s.emailVerified;
            return true;
          });
          break;

        case 'dateRange':
          if (value.startDate && value.endDate) {
            result = result.filter(s => {
              if (!s.createdAt) return false;
              const staffDate = new Date(s.createdAt);
              return staffDate >= new Date(value.startDate) && staffDate <= new Date(value.endDate);
            });
          }
          break;

        case 'search':
          result = staffUtils.searchStaff(result, value);
          break;

        default:
          break;
      }
    });

    return result;
  }, []);

  const setFilter = useCallback((key, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const removeFilter = useCallback((key) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
  }, []);

  const toggleStatusFilter = useCallback((status) => {
    setActiveFilters(prev => {
      const currentStatuses = prev.status || [];
      const isArray = Array.isArray(currentStatuses);
      const statusArray = isArray ? currentStatuses : [currentStatuses];
      
      const newStatuses = statusArray.includes(status)
        ? statusArray.filter(s => s !== status)
        : [...statusArray, status];
        
      return {
        ...prev,
        status: newStatuses.length === 0 ? undefined : newStatuses
      };
    });
  }, []);

  const toggleRoleFilter = useCallback((role) => {
    setActiveFilters(prev => {
      const currentRoles = prev.role || [];
      const isArray = Array.isArray(currentRoles);
      const roleArray = isArray ? currentRoles : [currentRoles];
      
      const newRoles = roleArray.includes(role)
        ? roleArray.filter(r => r !== role)
        : [...roleArray, role];
        
      return {
        ...prev,
        role: newRoles.length === 0 ? undefined : newRoles
      };
    });
  }, []);

  const saveCurrentFilter = useCallback((name) => {
    const filterToSave = {
      id: Date.now(),
      name,
      filters: { ...activeFilters },
      createdAt: new Date().toISOString(),
      resultCount: filteredStaff.length
    };
    
    setSavedFilters(prev => [...prev, filterToSave]);
    return filterToSave;
  }, [activeFilters, filteredStaff]);

  const loadSavedFilter = useCallback((filterId) => {
    const savedFilter = savedFilters.find(f => f.id === filterId);
    if (savedFilter) {
      setActiveFilters(savedFilter.filters);
    }
  }, [savedFilters]);

  const deleteSavedFilter = useCallback((filterId) => {
    setSavedFilters(prev => prev.filter(f => f.id !== filterId));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.keys(activeFilters).length > 0;
  }, [activeFilters]);

  const getFilterSummary = useCallback(() => {
    const summary = [];
    
    if (activeFilters.status) {
      const statuses = Array.isArray(activeFilters.status) 
        ? activeFilters.status 
        : [activeFilters.status];
      summary.push(t('utils.filterSummary.status', { statuses: statuses.join(', ') }));
    }
    
    if (activeFilters.role) {
      const roles = Array.isArray(activeFilters.role) 
        ? activeFilters.role 
        : [activeFilters.role];
      summary.push(t('utils.filterSummary.role', { roles: roles.join(', ') }));
    }
    
    if (activeFilters.experience) {
      summary.push(t('utils.filterSummary.experience', { experience: activeFilters.experience }));
    }
    
    if (activeFilters.verification) {
      summary.push(t('utils.filterSummary.verification', { verification: activeFilters.verification }));
    }
    
    if (activeFilters.dateRange) {
      summary.push(t('utils.filterSummary.dateRange'));
    }
    
    if (activeFilters.search) {
      summary.push(t('utils.filterSummary.search', { query: activeFilters.search }));
    }
    
    return summary;
  }, [activeFilters, t]);

  return {
    activeFilters,
    savedFilters,
    availableStatuses,
    availableRoles,
    filteredStaff,
    filterStats,
    hasActiveFilters,
    
    setFilter,
    removeFilter,
    clearAllFilters,
    toggleStatusFilter,
    toggleRoleFilter,
    saveCurrentFilter,
    loadSavedFilter,
    deleteSavedFilter,
    getFilterSummary
  };
};

export default useStaffFilters;

import { useTranslation } from 'react-i18next';
import { staffUtils } from '../utils';

export const useStaffUtils = () => {
  const { t } = useTranslation('staff');

  const formatFullName = (firstName, lastName) => {
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();
    return fullName || t('utils.unknownUser');
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return t('utils.notAvailable');
    return staffUtils.formatPhoneNumber(phone);
  };

  const formatEmail = (email) => {
    if (!email) return t('utils.notAvailable');
    return staffUtils.formatEmail(email);
  };

  const formatDate = (dateString, options = {}) => {
    if (!dateString) return t('utils.notAvailable');
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t('utils.invalidDate');
      
      const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };
      
      return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
    } catch (error) {
      console.error('Error formatting date:', error);
      return t('utils.invalidDate');
    }
  };

  const formatDateTime = (dateTimeString, options = {}) => {
    if (!dateTimeString) return t('utils.notAvailable');
    
    try {
      const dateTime = new Date(dateTimeString);
      if (isNaN(dateTime.getTime())) return t('utils.invalidDateTime');
      
      return dateTime.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options
      });
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return t('utils.invalidDateTime');
    }
  };

  const formatContractType = (type) => {
    const typeKey = type?.toLowerCase().replace('-', '');
    const contractTypes = {
      'fulltime': 'fullTime',
      'parttime': 'partTime',
      'contract': 'contract',
      'temporary': 'temporary',
      'intern': 'intern'
    };
    
    const translationKey = contractTypes[typeKey];
    return translationKey ? t(`utils.contractTypes.${translationKey}`) : type || t('utils.unknown');
  };

  const getFilterSummary = (activeFilters) => {
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
  };

  return {
    ...staffUtils,
    formatFullName,
    formatPhoneNumber,
    formatEmail,
    formatDate,
    formatDateTime,
    formatContractType,
    getFilterSummary
  };
};

export default useStaffUtils;

import { useState, useEffect, useCallback } from 'react';
import { reportsService } from '../services';
import { filterReports, sortReports } from '../utils';

export const useReportsManagement = (doctorId) => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    patientName: '',
    diagnosisName: '',
    referralDoctor: '',
    year: '',
    month: '',
    day: ''
  });
  const [sortConfig, setSortConfig] = useState({
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const fetchReports = useCallback(async () => {
    if (!doctorId) return;

    setLoading(true);
    setError('');

    try {
      const data = await reportsService.fetchReports(doctorId, filters);
      setReports(data);
    } catch (err) {
      setError(err.message);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId, filters]);


  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => {
      const updatedFilters = { ...prev, ...newFilters };
      
      if (newFilters.year && newFilters.year !== prev.year) {
        updatedFilters.month = '';
        updatedFilters.day = '';
      }
      if (newFilters.month && newFilters.month !== prev.month) {
        updatedFilters.day = '';
      }
      
      return updatedFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      patientName: '',
      diagnosisName: '',
      referralDoctor: '',
      year: '',
      month: '',
      day: ''
    });
  }, []);

  const updateSort = useCallback((sortBy, sortOrder = 'desc') => {
    setSortConfig({ sortBy, sortOrder });
  }, []);

  const deleteReport = useCallback(async (reportId) => {
    try {
      await reportsService.deleteReport(reportId);
      setReports(prev => prev.filter(report => report.id !== reportId));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const refreshReports = useCallback(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    let result = filterReports(reports, filters);
    result = sortReports(result, sortConfig.sortBy, sortConfig.sortOrder);
    setFilteredReports(result);
  }, [reports, filters, sortConfig]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
  reports: filteredReports,
    allReports: reports,
    loading,
    error,
    filters,
    sortConfig,
    fetchReports,
    refreshReports,
    updateFilters,
    clearFilters,
    updateSort,
    deleteReport,
    setError
  };
};

export default useReportsManagement;

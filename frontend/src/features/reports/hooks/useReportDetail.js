import { useState, useEffect, useCallback } from 'react';
import { reportsService } from '../services';
import { formatReportDate, formatPatientName, formatDoctorName } from '../utils';
import i18n from '../../../i18n';

export const useReportDetail = (reportId) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!reportId) return;

    setLoading(true);
    setError('');

    try {
      const data = await reportsService.fetchReportById(reportId);
      setReport(data);
    } catch (err) {
      setError(err.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  const deleteReport = useCallback(async () => {
    if (!reportId) return false;

    setDeleteLoading(true);
    setError('');

    try {
      await reportsService.deleteReport(reportId);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setDeleteLoading(false);
    }
  }, [reportId]);


  const updateReport = useCallback(async (reportData) => {
    if (!reportId) return false;

    try {
      const updatedReport = await reportsService.updateReport(reportId, reportData);
      setReport(updatedReport);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [reportId]);

  const formattedReport = useCallback(() => {
    if (!report) return null;

    const isRtl = (i18n.language || '').startsWith('ar');

    const patientFirst = isRtl && report.patientFirstNameAr ? report.patientFirstNameAr : report.patientFirstName;
    const patientLast = isRtl && report.patientLastNameAr ? report.patientLastNameAr : report.patientLastName;

    const doctorFirst = isRtl && report.doctorFirstNameAr ? report.doctorFirstNameAr : report.doctorFirstName;
    const doctorLast = isRtl && report.doctorLastNameAr ? report.doctorLastNameAr : report.doctorLastName;

    return {
      ...report,
      formattedDate: formatReportDate(report.createdAt || report.created_at),
      patientName: formatPatientName(patientFirst, patientLast),
      doctorName: formatDoctorName(doctorFirst, doctorLast)
    };
  }, [report]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return {
    report,
    formattedReport: formattedReport(),
    loading,
    error,
    deleteLoading,
    fetchReport,
    deleteReport,
    updateReport,
    setError
  };
};

export default useReportDetail;

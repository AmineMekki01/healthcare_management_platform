import i18n from '../../../i18n';

export const formatReportDate = (date, format = 'long') => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString(i18n.language || undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      case 'numeric':
        return dateObj.toLocaleDateString(i18n.language || undefined, {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });
      case 'long':
      default:
        return dateObj.toLocaleDateString(i18n.language || undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
    }
  } catch (error) {
    console.warn('Invalid date format:', date);
    return '';
  }
};

export const formatPatientName = (firstName, lastName, middleName = '') => {
  if (!firstName && !lastName) return i18n.t('reports:defaults.unknownPatient');
  
  const nameParts = [firstName, middleName, lastName].filter(Boolean);
  return nameParts.join(' ');
};

export const formatDoctorName = (firstName, lastName, includeTitle = true) => {
  if (!firstName && !lastName) return i18n.t('reports:defaults.unknownDoctor');
  
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  return includeTitle ? `${i18n.t('reports:labels.doctorPrefix')} ${fullName}` : fullName;
};

export const getReportStatus = (report) => {
  if (!report) {
    return { text: i18n.t('reports:statusLabels.unknown'), color: 'default' };
  }

  if (report.referralNeeded) {
    return { text: i18n.t('reports:statusLabels.referralRequired'), color: 'warning' };
  }

  return { text: i18n.t('reports:statusLabels.complete'), color: 'success' };
};


export const validateReportForm = (reportData) => {
  const errors = [];
  const warnings = [];

  if (!reportData.diagnosisName?.trim()) {
    errors.push(i18n.t('reports:validation.diagnosisNameRequired'));
  }

  if (!reportData.diagnosisDetails?.trim()) {
    errors.push(i18n.t('reports:validation.diagnosisDetailsRequired'));
  }

  if (!reportData.reportContent?.trim()) {
    errors.push(i18n.t('reports:validation.reportContentRequired'));
  }

  if (reportData.referralNeeded) {
    if (!reportData.referralSpecialty?.trim()) {
      errors.push(i18n.t('reports:validation.referralSpecialtyRequired'));
    }
    if (!reportData.referralDoctorName?.trim()) {
      errors.push(i18n.t('reports:validation.referralDoctorNameRequired'));
    }
  }

  if (reportData.diagnosisName && reportData.diagnosisName.length > 200) {
    warnings.push(i18n.t('reports:validation.diagnosisNameMaxLength'));
  }

  if (reportData.reportContent && reportData.reportContent.length < 50) {
    warnings.push(i18n.t('reports:validation.reportContentTooShort'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const getReportType = (report) => {
  if (!report?.diagnosisName) return i18n.t('reports:types.general');

  const diagnosis = report.diagnosisName.toLowerCase();
  
  if (diagnosis.includes('surgery') || diagnosis.includes('operation')) {
    return i18n.t('reports:types.surgical');
  }
  if (diagnosis.includes('follow-up') || diagnosis.includes('followup')) {
    return i18n.t('reports:types.followUp');
  }
  if (diagnosis.includes('consultation')) {
    return i18n.t('reports:types.consultation');
  }
  if (diagnosis.includes('emergency')) {
    return i18n.t('reports:types.emergency');
  }
  
  return i18n.t('reports:types.general');
};

export const generateReportSummary = (report, maxLength = 150) => {
  if (!report?.reportContent) return i18n.t('reports:defaults.noSummary');

  const content = report.reportContent.replace(/\n/g, ' ').trim();
  
  if (content.length <= maxLength) {
    return content;
  }

  return content.substring(0, maxLength).trim() + '...';
};

export const filterReports = (reports, filters = {}) => {
  if (!Array.isArray(reports)) return [];

  return reports.filter(report => {
    if (filters.patientName) {
      const patientName = formatPatientName(
        report.patientFirstName, 
        report.patientLastName
      ).toLowerCase();
      
      if (!patientName.includes(filters.patientName.toLowerCase())) {
        return false;
      }
    }

    if (filters.diagnosisName) {
      const diagnosis = (report.diagnosisName || '').toLowerCase();
      if (!diagnosis.includes(filters.diagnosisName.toLowerCase())) {
        return false;
      }
    }

    if (filters.referralDoctor) {
      const referralDoctor = (report.referralDoctorName || '').toLowerCase();
      if (!referralDoctor.includes(filters.referralDoctor.toLowerCase())) {
        return false;
      }
    }

    if (filters.year || filters.month || filters.day) {
      const reportDate = new Date(report.createdAt || report.created_at);
      
      if (filters.year && reportDate.getFullYear() !== parseInt(filters.year)) {
        return false;
      }
      
      if (filters.month && (reportDate.getMonth() + 1) !== parseInt(filters.month)) {
        return false;
      }
      
      if (filters.day && reportDate.getDate() !== parseInt(filters.day)) {
        return false;
      }
    }

    return true;
  });
};

export const sortReports = (reports, sortBy = 'date', sortOrder = 'desc') => {
  if (!Array.isArray(reports)) return [];

  return [...reports].sort((a, b) => {
    let valueA, valueB;

    switch (sortBy) {
      case 'patient':
        valueA = formatPatientName(a.patientFirstName, a.patientLastName);
        valueB = formatPatientName(b.patientFirstName, b.patientLastName);
        break;
      case 'diagnosis':
        valueA = a.diagnosisName || '';
        valueB = b.diagnosisName || '';
        break;
      case 'date':
      default:
        valueA = new Date(a.createdAt || a.created_at);
        valueB = new Date(b.createdAt || b.created_at);
        break;
    }

    if (sortBy === 'date') {
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    } else {
      const comparison = valueA.localeCompare(valueB);
      return sortOrder === 'asc' ? comparison : -comparison;
    }
  });
};

export const generateReportStats = (reports) => {
  if (!Array.isArray(reports)) {
    return {
      total: 0,
      withReferrals: 0,
      thisMonth: 0,
      thisWeek: 0,
      byType: {},
      bySpecialty: {}
    };
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats = {
    total: reports.length,
    withReferrals: 0,
    thisMonth: 0,
    thisWeek: 0,
    byType: {},
    bySpecialty: {}
  };

  reports.forEach(report => {
    const reportDate = new Date(report.createdAt || report.created_at);
    
    if (report.referralNeeded) {
      stats.withReferrals++;
    }

    if (reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear) {
      stats.thisMonth++;
    }

    if (reportDate >= oneWeekAgo) {
      stats.thisWeek++;
    }

    const type = getReportType(report);
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    if (report.referralNeeded && report.referralSpecialty) {
      stats.bySpecialty[report.referralSpecialty] = 
        (stats.bySpecialty[report.referralSpecialty] || 0) + 1;
    }
  });

  return stats;
};

export const exportReportsToCSV = (reports) => {
  if (!Array.isArray(reports) || reports.length === 0) {
    return '';
  }

  const headers = [
    i18n.t('reports:csv.headers.date'),
    i18n.t('reports:csv.headers.patientName'),
    i18n.t('reports:csv.headers.diagnosis'),
    i18n.t('reports:csv.headers.reportType'),
    i18n.t('reports:csv.headers.referralNeeded'),
    i18n.t('reports:csv.headers.referralSpecialty'),
    i18n.t('reports:csv.headers.referralDoctor')
  ];

  const csvRows = [
    headers.join(','),
    ...reports.map(report => [
      `"${formatReportDate(report.createdAt || report.created_at, 'short')}"`,
      `"${formatPatientName(report.patientFirstName, report.patientLastName)}"`,
      `"${report.diagnosisName || ''}"`,
      `"${getReportType(report)}"`,
      report.referralNeeded ? i18n.t('common:common.yes') : i18n.t('common:common.no'),
      `"${report.referralSpecialty || ''}"`,
      `"${report.referralDoctorName || ''}"`
    ].join(','))
  ];

  return csvRows.join('\n');
};

export const getFilterOptions = (reports) => {
  if (!Array.isArray(reports)) {
    return {
      years: [],
      specialties: [],
      types: []
    };
  }

  const years = new Set();
  const specialties = new Set();
  const types = new Set();

  reports.forEach(report => {
    const year = new Date(report.createdAt || report.created_at).getFullYear();
    years.add(year);

    if (report.referralSpecialty) {
      specialties.add(report.referralSpecialty);
    }

    types.add(getReportType(report));
  });

  return {
    years: Array.from(years).sort((a, b) => b - a),
    specialties: Array.from(specialties).sort(),
    types: Array.from(types).sort()
  };
};

export const canEditReport = (report, currentUserId) => {
  if (!report || !currentUserId) return false;
  
  return report.doctor_id === currentUserId;
};

export const canDeleteReport = (report, currentUserId) => {
  if (!report || !currentUserId) return false;
  
  return report.doctor_id === currentUserId;
};

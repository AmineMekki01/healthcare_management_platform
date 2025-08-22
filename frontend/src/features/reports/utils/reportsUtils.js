export const formatReportDate = (date, format = 'long') => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      case 'numeric':
        return dateObj.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });
      case 'long':
      default:
        return dateObj.toLocaleDateString('en-US', {
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
  if (!firstName && !lastName) return 'Unknown Patient';
  
  const nameParts = [firstName, middleName, lastName].filter(Boolean);
  return nameParts.join(' ');
};

export const formatDoctorName = (firstName, lastName, includeTitle = true) => {
  if (!firstName && !lastName) return 'Unknown Doctor';
  
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  return includeTitle ? `Dr. ${fullName}` : fullName;
};

export const getReportStatus = (report) => {
  if (!report) {
    return { text: 'Unknown', color: 'default' };
  }

  if (report.referralNeeded) {
    return { text: 'Referral Required', color: 'warning' };
  }

  return { text: 'Complete', color: 'success' };
};


export const validateReportForm = (reportData) => {
  const errors = [];
  const warnings = [];

  if (!reportData.diagnosisName?.trim()) {
    errors.push('Diagnosis name is required');
  }

  if (!reportData.diagnosisDetails?.trim()) {
    errors.push('Diagnosis details are required');
  }

  if (!reportData.reportContent?.trim()) {
    errors.push('Report content is required');
  }

  if (reportData.referralNeeded) {
    if (!reportData.referralSpecialty?.trim()) {
      errors.push('Referral specialty is required when referral is needed');
    }
    if (!reportData.referralDoctorName?.trim()) {
      errors.push('Referral doctor name is required when referral is needed');
    }
  }

  if (reportData.diagnosisName && reportData.diagnosisName.length > 200) {
    warnings.push('Diagnosis name should be under 200 characters');
  }

  if (reportData.reportContent && reportData.reportContent.length < 50) {
    warnings.push('Report content seems too short for a medical report');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const getReportType = (report) => {
  if (!report?.diagnosisName) return 'General';

  const diagnosis = report.diagnosisName.toLowerCase();
  
  if (diagnosis.includes('surgery') || diagnosis.includes('operation')) {
    return 'Surgical';
  }
  if (diagnosis.includes('follow-up') || diagnosis.includes('followup')) {
    return 'Follow-up';
  }
  if (diagnosis.includes('consultation')) {
    return 'Consultation';
  }
  if (diagnosis.includes('emergency')) {
    return 'Emergency';
  }
  
  return 'General';
};

export const generateReportSummary = (report, maxLength = 150) => {
  if (!report?.reportContent) return 'No summary available';

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
    'Date',
    'Patient Name',
    'Diagnosis',
    'Report Type',
    'Referral Needed',
    'Referral Specialty',
    'Referral Doctor'
  ];

  const csvRows = [
    headers.join(','),
    ...reports.map(report => [
      `"${formatReportDate(report.createdAt || report.created_at, 'short')}"`,
      `"${formatPatientName(report.patientFirstName, report.patientLastName)}"`,
      `"${report.diagnosisName || ''}"`,
      `"${getReportType(report)}"`,
      report.referralNeeded ? 'Yes' : 'No',
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

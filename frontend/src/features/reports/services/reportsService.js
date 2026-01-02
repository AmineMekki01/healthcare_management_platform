import axios from '../../../components/axiosConfig';
import i18n from '../../../i18n';

class ReportsService {
    constructor() {
        this.baseURL = '/api/v1';
    }

    async fetchReports(doctorId, filters = {}) {
        if (!doctorId) {
        throw new Error(i18n.t('reports:errors.doctorIdRequired'));
        }

        try {
        const params = this.buildFilterParams(filters);
        const response = await axios.get(`${this.baseURL}/reports/${doctorId}`, { params });
        
        const reportsData = response.data || [];
        
        const sortedReports = Array.isArray(reportsData) 
            ? reportsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            : [];

        return sortedReports;
        } catch (error) {
        console.error('Error fetching reports:', error);
        throw new Error(i18n.t('reports:errors.loadReports'));
        }
    }

    async fetchReportById(reportId) {
        if (!reportId) {
        throw new Error(i18n.t('reports:errors.reportIdRequired'));
        }

        try {
        const response = await axios.get(`${this.baseURL}/doctor-report/${reportId}`);
        return response.data;
        } catch (error) {
        console.error('Error fetching report details:', error);
        throw new Error(i18n.t('reports:errors.loadReportDetails'));
        }
    }

    async createReport(reportData, appointmentId, doctorId, patientId) {
        if (!reportData || !appointmentId || !doctorId || !patientId) {
            console.log('Missing required fields:', { reportData, appointmentId, doctorId, patientId });
            throw new Error(i18n.t('reports:errors.requiredFields'));
        }

        try {
            const reportPayload = {
                ...reportData,
                appointmentId: appointmentId,
                doctorId: doctorId,
                patientId: patientId
            };
            console.log('Creating report with payload:', reportPayload);
            const response = await axios.post(`${this.baseURL}/reports`, reportPayload);
            return response.data;
        } catch (error) {
            console.error('Error creating report:', error);
            throw new Error(i18n.t('reports:errors.createReport'));
        }
    }

    async updateReport(reportId, reportData) {
        if (!reportId) {
        throw new Error(i18n.t('reports:errors.reportIdRequired'));
        }
        if (!reportData) {
        throw new Error(i18n.t('reports:errors.requiredFields'));
        }

        try {
        const response = await axios.put(`${this.baseURL}/doctor-report/${reportId}`, reportData);
        return response.data;
        } catch (error) {
        console.error('Error updating report:', error);
        throw new Error(i18n.t('reports:errors.updateReport'));
        }
    }

    async deleteReport(reportId) {
        if (!reportId) {
        throw new Error(i18n.t('reports:errors.reportIdRequired'));
        }

        try {
        await axios.delete(`${this.baseURL}/doctor-report/${reportId}`);
        } catch (error) {
        console.error('Error deleting report:', error);
        throw new Error(i18n.t('reports:errors.deleteReport'));
        }
    }

    async fetchAppointmentDetails(appointmentId) {
        if (!appointmentId) {
        throw new Error(i18n.t('reports:errors.appointmentIdRequired'));
        }

        try {
        const response = await axios.get(`${this.baseURL}/appointments/${appointmentId}`);
        return response.data;
        } catch (error) {
        console.error('Error fetching appointment details:', error);
        throw new Error(i18n.t('reports:errors.loadAppointmentDetails'));
        }
    }

    buildFilterParams(filters) {
        const params = {};
        
        if (filters.year) params.year = filters.year;
        if (filters.month) params.month = filters.month;
        if (filters.day) params.day = filters.day;
        if (filters.patientName) params.patientName = filters.patientName;
        if (filters.diagnosisName) params.diagnosisName = filters.diagnosisName;
        if (filters.referralDoctor) params.referralDoctor = filters.referralDoctor;

        return params;
    }

    validateReportData(reportData) {
        const errors = [];

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

        return {
        isValid: errors.length === 0,
        errors
        };
    }

    formatReportData(report) {
        if (!report) return null;

        return {
        ...report,
        formattedDate: this.formatReportDate(report.createdAt),
        hasReferral: Boolean(report.referralNeeded),
        patientDisplayName: this.formatPatientName(report.patientFirstName, report.patientLastName),
        doctorDisplayName: this.formatDoctorName(report.doctorFirstName, report.doctorLastName)
        };
    }

    formatReportDate(date) {
        if (!date) return '';
        
        try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString(i18n.language || undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        } catch (error) {
        console.warn('Invalid date format:', date);
        return '';
        }
    }

    formatPatientName(firstName, lastName) {
        if (!firstName && !lastName) return i18n.t('reports:defaults.unknownPatient');
        return [firstName, lastName].filter(Boolean).join(' ');
    }

    formatDoctorName(firstName, lastName) {
        if (!firstName && !lastName) return i18n.t('reports:defaults.unknownDoctor');
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        return `${i18n.t('reports:labels.doctorPrefix')} ${fullName}`;
    }

    generateReportStats(reports) {
        if (!Array.isArray(reports)) {
        return {
            total: 0,
            withReferrals: 0,
            thisMonth: 0,
            thisYear: 0
        };
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return {
        total: reports.length,
        withReferrals: reports.filter(report => report.referralNeeded).length,
        thisMonth: reports.filter(report => {
            const reportDate = new Date(report.createdAt);
            return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
        }).length,
        thisYear: reports.filter(report => {
            const reportDate = new Date(report.createdAt);
            return reportDate.getFullYear() === currentYear;
        }).length
        };
    }

    exportToCSV(reports) {
        if (!Array.isArray(reports) || reports.length === 0) {
        return '';
        }

        const headers = [
        i18n.t('reports:csv.headers.date'),
        i18n.t('reports:csv.headers.patientName'),
        i18n.t('reports:csv.headers.diagnosis'),
        i18n.t('reports:csv.headers.referralNeeded'),
        i18n.t('reports:csv.headers.referralDoctor')
        ];

        const csvRows = [
        headers.join(','),
        ...reports.map(report => [
            this.formatReportDate(report.createdAt ),
            `"${this.formatPatientName(report.patientFirstName, report.patientLastName)}"`,
            `"${report.diagnosisName || ''}"`,
            report.referralNeeded ? i18n.t('common:common.yes') : i18n.t('common:common.no'),
            `"${report.referralDoctorName || ''}"`
        ].join(','))
        ];

        return csvRows.join('\n');
    }
}

export const reportsService = new ReportsService();
export const fetchReports = (doctorId, filters) => reportsService.fetchReports(doctorId, filters);
export const fetchReportById = (reportId) => reportsService.fetchReportById(reportId);
export const createReport = (reportData, appointmentId, doctorId, patientId) => reportsService.createReport(reportData, appointmentId, doctorId, patientId);
export const updateReport = (reportId, reportData) => reportsService.updateReport(reportId, reportData);
export const deleteReport = (reportId) => reportsService.deleteReport(reportId);
export const fetchAppointmentDetails = (appointmentId) => reportsService.fetchAppointmentDetails(appointmentId);
export default reportsService;

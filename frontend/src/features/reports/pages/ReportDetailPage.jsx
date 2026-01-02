import React, {useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { CardContent, Typography, CircularProgress, Button, Divider, Box, Grid, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, GetApp as DownloadIcon } from "@mui/icons-material";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useReportDetail } from "../hooks";
import { getLocalizedSpecialtyLabel } from '../../../utils/specialties';

export default function ReportDetailPage() {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('reports');
    const { t: tMedical } = useTranslation('medical');
    const isRtl = (i18n.language || '').startsWith('ar');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const reportRef = useRef();

    const {
        report,
        formattedReport,
        loading,
        error,
        deleteLoading,
        deleteReport,
        setError
    } = useReportDetail(reportId);
    console.log("Report Detail:", report);
    const generatePDF = async () => {
        const input = reportRef.current;
        const canvas = await html2canvas(input, {
            scale: 4,
            useCORS: true,
            scrollX: 0,
            scrollY: 0,
            windowWidth: document.documentElement.offsetWidth,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        const margin = 10;
        const pdfWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", margin, margin, pdfWidth, pdfHeight);
        pdf.save(`medical-report-${reportId}.pdf`);
    };

    const handleEdit = () => {
        navigate(`/edit-medical-report/${reportId}`);
    };

    const handleDeleteConfirm = async () => {
        try {
            const success = await deleteReport();
            if (success) {
                setShowDeleteDialog(false);
                navigate('/medical-report/' + (report.doctorId || report.doctor_id));
            }
        } catch (error) {
            console.error("Error deleting report:", error);
            setError(t('errors.deleteReport'));
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    if (!report) {
        return (
            <div style={{ padding: '20px' }}>
                <Typography variant="h6">{t('pages.reportDetail.reportNotFound')}</Typography>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </div>
        );
    }

    const rawCreatedAt = report.createdAt || report.created_at;
    const createdAtDate = rawCreatedAt ? new Date(rawCreatedAt) : null;
    const createdAtText = createdAtDate && !Number.isNaN(createdAtDate.getTime())
      ? createdAtDate.toLocaleDateString(i18n.language || undefined)
      : t('common:common.notAvailable');

    const patientName = [
      isRtl && report.patientFirstNameAr ? report.patientFirstNameAr : report.patientFirstName,
      isRtl && report.patientLastNameAr ? report.patientLastNameAr : report.patientLastName,
    ].filter(Boolean).join(' ');

    const doctorName = [
      isRtl && report.doctorFirstNameAr ? report.doctorFirstNameAr : report.doctorFirstName,
      isRtl && report.doctorLastNameAr ? report.doctorLastNameAr : report.doctorLastName,
    ].filter(Boolean).join(' ');

    const referralDoctorDisplayName = (() => {
      const hasReferralDoctorId = Boolean(report.referralDoctorId || report.referral_doctor_id);
      if (!hasReferralDoctorId) return report.referralDoctorName;

      const first = isRtl && report.referralDoctorFirstNameAr
        ? report.referralDoctorFirstNameAr
        : report.referralDoctorFirstName;
      const last = isRtl && report.referralDoctorLastNameAr
        ? report.referralDoctorLastNameAr
        : report.referralDoctorLastName;

      const full = [first, last].filter(Boolean).join(' ').trim();
      return full || report.referralDoctorName;
    })();

    return (
        <div style={{ padding: '20px' }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold" color="primary">{t('pages.reportDetail.patientReportTitle')}</Typography>
                <Box display="flex" gap={2}>
                    <Button 
                        variant="outlined" 
                        color="primary" 
                        startIcon={<EditIcon />}
                        onClick={handleEdit}
                    >
                        {t('actions.editReport')}
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="error" 
                        startIcon={<DeleteIcon />}
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        {t('actions.deleteReport')}
                    </Button>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<DownloadIcon />}
                        onClick={generatePDF}
                    >
                        {t('actions.downloadPdf')}
                    </Button>
                </Box>
            </Box>

            <Paper ref={reportRef} style={{ padding: '30px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff', maxWidth: '800px', margin: 'auto' }}>
                <Box mb={4} textAlign="center">
                    <Typography variant="h5" fontWeight="bold" color="primary">{t('pages.reportDetail.medicalReportTitle')}</Typography>
                    <Typography variant="subtitle1" color="textSecondary">{t('pages.reportDetail.generatedOn')} {createdAtText}</Typography>
                </Box>

                <Divider style={{ marginBottom: '20px' }} />

                <CardContent>
                    <Box mb={4}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>{t('pages.reportDetail.patientInformation')}</Typography>
                        <Divider style={{ marginBottom: '15px' }} />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="body1"><strong>{t('labels.patient')}:</strong> {patientName}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body1"><strong>{t('common:userTypes.doctor')}:</strong> {t('labels.doctorPrefix')} {doctorName}</Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    <Box mb={4}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>{t('pages.reportDetail.diagnosisDetails')}</Typography>
                        <Divider style={{ marginBottom: '15px' }} />
                        <Typography variant="body1" style={{ marginBottom: '10px' }}><strong>{t('labels.diagnosis')}:</strong> {report.diagnosisName}</Typography>
                        <Typography variant="body2" color="textSecondary"><strong>{t('form.diagnosisDetails')}:</strong> {report.diagnosisDetails}</Typography>
                    </Box>

                    <Box mb={4}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>{t('pages.reportDetail.examinationReport')}</Typography>
                        <Divider style={{ marginBottom: '15px' }} />
                        <Typography variant="body2" color="textSecondary" style={{ whiteSpace: 'pre-line' }}>
                            {report.reportContent}
                        </Typography>
                    </Box>

                    {report.medications && report.medications.length > 0 && (
                        <Box mb={4}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>{t('pages.reportDetail.medicationDetails')}</Typography>
                            <Divider style={{ marginBottom: '15px' }} />
                            {report.medications.map((medication, index) => (
                                <Box key={index} mb={2}>
                                    <Typography variant="body1"><strong>{t('medications.fields.medicationName')}:</strong> {medication.medicationName || medication.medication_name || medication.name}</Typography>
                                    <Typography variant="body2" color="textSecondary"><strong>{t('medications.fields.dosage')}:</strong> {medication.dosage}</Typography>
                                    <Typography variant="body2" color="textSecondary"><strong>{t('medications.fields.duration')}:</strong> {medication.duration}</Typography>
                                    <Typography variant="body2" color="textSecondary"><strong>{t('medications.fields.frequency')}:</strong> {medication.frequency}</Typography>
                                    <Typography variant="body2" color="textSecondary"><strong>{t('medications.fields.instructions')}:</strong> {medication.instructions}</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}

                    {report.referralNeeded && (
                        <Box mb={4}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>{t('pages.reportDetail.referralInformation')}</Typography>
                            <Divider style={{ marginBottom: '15px' }} />
                            <Typography variant="body1" style={{ marginBottom: '10px' }}><strong>{t('form.referralSpecialty')}:</strong> {getLocalizedSpecialtyLabel(report.referralSpecialty, tMedical)}</Typography>
                            <Typography variant="body1" style={{ marginBottom: '10px' }}><strong>{t('form.referredDoctorName')}:</strong> {t('labels.doctorPrefix')} {referralDoctorDisplayName}</Typography>
                            <Typography variant="body2" color="textSecondary"><strong>{t('form.referralMessage')}:</strong> {report.referralMessage || report.referral_message}</Typography>
                        </Box>
                    )}
                </CardContent>
            </Paper>

            <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
                <DialogTitle>{t('pages.reportDetail.confirmDeleteTitle')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {t('confirmations.deleteReport')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteDialog(false)} disabled={deleteLoading}>
                        {t('common:buttons.cancel')}
                    </Button>
                    <Button 
                        onClick={handleDeleteConfirm} 
                        color="error" 
                        variant="contained"
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
                    >
                        {deleteLoading ? t('status.deleting') : t('common:buttons.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

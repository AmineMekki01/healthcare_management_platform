import React, {useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CardContent, Typography, CircularProgress, Button, Divider, Box, Grid, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, GetApp as DownloadIcon } from "@mui/icons-material";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useReportDetail } from "../hooks";

export default function ReportDetailPage() {
    const { reportId } = useParams();
    const navigate = useNavigate();
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
                navigate('/medical-report/' + report.doctor_id);
            }
        } catch (error) {
            console.error("Error deleting report:", error);
            setError("Failed to delete report. Please try again.");
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    if (!report) {
        return (
            <div style={{ padding: '20px' }}>
                <Typography variant="h6">Report not found</Typography>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold" color="primary">Patient Report</Typography>
                <Box display="flex" gap={2}>
                    <Button 
                        variant="outlined" 
                        color="primary" 
                        startIcon={<EditIcon />}
                        onClick={handleEdit}
                    >
                        Edit Report
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="error" 
                        startIcon={<DeleteIcon />}
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        Delete Report
                    </Button>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<DownloadIcon />}
                        onClick={generatePDF}
                    >
                        Download PDF
                    </Button>
                </Box>
            </Box>

            <Paper ref={reportRef} style={{ padding: '30px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff', maxWidth: '800px', margin: 'auto' }}>
                <Box mb={4} textAlign="center">
                    <Typography variant="h5" fontWeight="bold" color="primary">Medical Report</Typography>
                    <Typography variant="subtitle1" color="textSecondary">Generated on: {new Date(report.created_at).toLocaleDateString()}</Typography>
                </Box>

                <Divider style={{ marginBottom: '20px' }} />

                <CardContent>
                    <Box mb={4}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Patient Information</Typography>
                        <Divider style={{ marginBottom: '15px' }} />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="body1"><strong>Patient Name:</strong> {report.patientFirstName} {report.patientLastName}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body1"><strong>Doctor:</strong> Dr. {report.doctorFirstName} {report.doctorLastName}</Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    <Box mb={4}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Diagnosis Details</Typography>
                        <Divider style={{ marginBottom: '15px' }} />
                        <Typography variant="body1" style={{ marginBottom: '10px' }}><strong>Diagnosis:</strong> {report.diagnosisName}</Typography>
                        <Typography variant="body2" color="textSecondary"><strong>Details:</strong> {report.diagnosisDetails}</Typography>
                    </Box>

                    <Box mb={4}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Examination Report</Typography>
                        <Divider style={{ marginBottom: '15px' }} />
                        <Typography variant="body2" color="textSecondary" style={{ whiteSpace: 'pre-line' }}>
                            {report.reportContent}
                        </Typography>
                    </Box>

                    {report.medications && report.medications.length > 0 && (
                        <Box mb={4}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>Medication Details</Typography>
                            <Divider style={{ marginBottom: '15px' }} />
                            {report.medications.map((medication, index) => (
                                <Box key={index} mb={2}>
                                    <Typography variant="body1"><strong>Medication:</strong> {medication.name}</Typography>
                                    <Typography variant="body2" color="textSecondary"><strong>Dosage:</strong> {medication.dosage}</Typography>
                                    <Typography variant="body2" color="textSecondary"><strong>Duration:</strong> {medication.duration}</Typography>
                                    <Typography variant="body2" color="textSecondary"><strong>Frequency:</strong> {medication.frequency}</Typography>
                                    <Typography variant="body2" color="textSecondary"><strong>Instructions:</strong> {medication.instructions}</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                    dosage

                    {report.referralNeeded && (
                        <Box mb={4}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>Referral Information</Typography>
                            <Divider style={{ marginBottom: '15px' }} />
                            <Typography variant="body1" style={{ marginBottom: '10px' }}><strong>Referred Specialty:</strong> {report.referralSpecialty}</Typography>
                            <Typography variant="body1" style={{ marginBottom: '10px' }}><strong>Referred Doctor:</strong> Dr. {report.referralDoctorName}</Typography>
                            <Typography variant="body2" color="textSecondary"><strong>Referral Message:</strong> {report.referral_message}</Typography>
                        </Box>
                    )}
                </CardContent>
            </Paper>

            <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this medical report? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteDialog(false)} disabled={deleteLoading}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteConfirm} 
                        color="error" 
                        variant="contained"
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
                    >
                        {deleteLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

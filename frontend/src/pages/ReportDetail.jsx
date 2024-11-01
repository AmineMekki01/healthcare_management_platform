import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { CardContent, Typography, CircularProgress, Button, Divider, Box, Grid, Paper } from "@mui/material";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import axios from './../components/axiosConfig';

export default function ReportDetail() {
    const { reportId } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const reportRef = useRef(); // Ref for capturing the report content

    const fetchReport = async () => {
        try {
            const response = await axios.get(`/api/v1/doctor-report/${reportId}`);
            setReport(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching report details:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [reportId]);

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
        pdf.save("report.pdf");
    };

    if (loading) {
        return <CircularProgress />;
    }

    if (!report) {
        return <Typography variant="h6">Report not found</Typography>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold" color="primary">Patient Report</Typography>
                <Button variant="contained" color="primary" onClick={generatePDF}>
                    Download PDF
                </Button>
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
                                <Typography variant="body1"><strong>Patient Name:</strong> {report.patient_first_name} {report.patient_last_name}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body1"><strong>Doctor:</strong> Dr. {report.doctor_first_name} {report.doctor_last_name}</Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    <Box mb={4}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Diagnosis Details</Typography>
                        <Divider style={{ marginBottom: '15px' }} />
                        <Typography variant="body1" style={{ marginBottom: '10px' }}><strong>Diagnosis:</strong> {report.diagnosis_name}</Typography>
                        <Typography variant="body2" color="textSecondary"><strong>Details:</strong> {report.diagnosis_details}</Typography>
                    </Box>

                    <Box mb={4}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Examination Report</Typography>
                        <Divider style={{ marginBottom: '15px' }} />
                        <Typography variant="body2" color="textSecondary" style={{ whiteSpace: 'pre-line' }}>
                            {report.report_content}
                        </Typography>
                    </Box>

                    {report.referral_needed && (
                        <Box mb={4}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>Referral Information</Typography>
                            <Divider style={{ marginBottom: '15px' }} />
                            <Typography variant="body1" style={{ marginBottom: '10px' }}><strong>Referred Specialty:</strong> {report.referral_specialty}</Typography>
                            <Typography variant="body1" style={{ marginBottom: '10px' }}><strong>Referred Doctor:</strong> Dr. {report.referral_doctor_name}</Typography>
                            <Typography variant="body2" color="textSecondary"><strong>Referral Message:</strong> {report.referral_message}</Typography>
                        </Box>
                    )}
                </CardContent>
            </Paper>
        </div>
    );
}

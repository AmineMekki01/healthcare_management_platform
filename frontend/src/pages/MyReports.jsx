import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../components/Auth/AuthContext";
import { Card, CardContent, Typography, TextField, Grid } from "@mui/material";
import axios from './../components/axiosConfig';

export default function DoctorReports() {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [filterCriteria, setFilterCriteria] = useState({
        patientName: "",
        diagnosisName: "",
        referralDoctor: ""
    });
    const { userId } = useContext(AuthContext);
    const navigate = useNavigate();

    const getReports = async () => {
        try {
            const response = await axios.get(`/api/v1/reports/${userId}`);
            const sortedReports = response.data.sort((a, b) => new Date(b.creation_date) - new Date(a.creation_date));
            setReports(sortedReports);
            setFilteredReports(sortedReports);
        } catch (error) {
            console.error("Error fetching reports:", error);
        }
    };

    useEffect(() => {
        getReports();
    }, [userId]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterCriteria((prev) => ({ ...prev, [name]: value }));

        const filtered = reports.filter((report) => {
            const patientFullName = `${report.patient_first_name} ${report.patient_last_name}`.toLowerCase();
            const matchesPatient = patientFullName.includes(filterCriteria.patientName.toLowerCase());
            const matchesDiagnosis = report.diagnosis_name.toLowerCase().includes(filterCriteria.diagnosisName.toLowerCase());
            const matchesReferral = report.referral_doctor_name ? report.referral_doctor_name.toLowerCase().includes(filterCriteria.referralDoctor.toLowerCase()) : true;

            return matchesPatient && matchesDiagnosis && matchesReferral;
        });
        setFilteredReports(filtered);
    };

    const handleReportClick = (reportId) => {
        navigate(`/doctor-report/${reportId}`);
    };

    return (
        <>
            <div style={{ padding: '20px' }}>
                <Typography variant="h5" gutterBottom>Doctor's Reports</Typography>

                <Grid container spacing={2} style={{ marginBottom: '20px' }}>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Filter by Patient Name"
                            variant="outlined"
                            fullWidth
                            name="patientName"
                            value={filterCriteria.patientName}
                            onChange={handleFilterChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Filter by Diagnosis Name"
                            variant="outlined"
                            fullWidth
                            name="diagnosisName"
                            value={filterCriteria.diagnosisName}
                            onChange={handleFilterChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Filter by Referral Doctor"
                            variant="outlined"
                            fullWidth
                            name="referralDoctor"
                            value={filterCriteria.referralDoctor}
                            onChange={handleFilterChange}
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    {filteredReports.map((report) => (
                        <Grid item xs={12} sm={6} md={4} key={report.report_id}>
                            <Card
                                variant="outlined"
                                style={{ backgroundColor: '#f9f9f9', borderRadius: '8px', cursor: 'pointer' }}
                                onClick={() => handleReportClick(report.report_id)}
                            >
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Patient: {report.patient_first_name} {report.patient_last_name}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Diagnosis:</strong> {report.diagnosis_name}
                                    </Typography>
                                    {report.referral_doctor_name && (
                                        <Typography variant="body2" color="textSecondary">
                                            <strong>Referred to:</strong> Dr. {report.referral_doctor_name}
                                        </Typography>
                                    )}
                                    <Typography variant="body2" color="textSecondary">
                                        <strong>Date:</strong> {new Date(report.created_at).toLocaleDateString()}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </div>
        </>
    );
}

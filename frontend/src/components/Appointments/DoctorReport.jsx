import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Checkbox, Input, InputLabel, TextField, Typography, FormControlLabel, Card, CardContent, Divider, Box, Grid } from '@mui/material';
import { CheckBoxOutlineBlank, CheckBox } from '@mui/icons-material';
import axios from '../axiosConfig';

export default function DoctorReport() {
   const { appointmentId } = useParams();
   const [appointmentInfo, setAppointmentInfo] = useState({});
   const [reportContent, setReportContent] = useState("");
   const [diagnosisName, setDiagnosisName] = useState("");
   const [diagnosisDetails, setDiagnosisDetails] = useState("");

   const [diagnosisMade, setDiagnosisMade] = useState(false);
   const [referralNeeded, setReferralNeeded] = useState(false);
   const [referralSpecialty, setReferralSpecialty] = useState("");
   const [referralDoctorName, setReferralDoctorName] = useState("");
   const [referralMessage, setReferralMessage] = useState("");
   const navigate = useNavigate();

   useEffect(() => {
      const fetchPatientInfo = async () => {
         try {
            const response = await axios.get(`/api/v1/appointments/${appointmentId}`);
            setAppointmentInfo(response.data);
         } catch (error) {
            console.error("Error fetching patient info:", error);
         }
      };
      fetchPatientInfo();
   }, [appointmentId]);

   const handleSubmit = async () => {
      try {
         const reportData = {
            appointment_id: appointmentId,
            doctor_id: appointmentInfo.doctor_id,
            patient_id: appointmentInfo.patient_id,
            patient_first_name: appointmentInfo.patient_first_name,
            patient_last_name: appointmentInfo.patient_last_name,
            doctor_first_name: appointmentInfo.doctor_first_name,
            doctor_last_name: appointmentInfo.doctor_last_name,
            report_content: reportContent,
            diagnosis_made: diagnosisMade,
            diagnosis_name: diagnosisMade ? diagnosisName : null,
            diagnosis_details: diagnosisMade ? diagnosisDetails : null,
            referral_needed: referralNeeded,
            referral_specialty: referralNeeded ? referralSpecialty : null,
            referral_doctor_name: referralNeeded ? referralDoctorName : null,
            referral_message: referralNeeded ? referralMessage : null
         };
         console.log("reportData : ", reportData)
         const response = await axios.post('/api/v1/reports', reportData);

         alert("Report submitted successfully!");
         navigate('/DoctorDashboard');
      } catch (error) {
         console.error("Error submitting report:", error);
         alert("Failed to submit report.");
      }
   };

   const formatTime = (dateString) => new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
   const formatDate = (dateString) => new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
   });

   return (
      <Box display="flex" justifyContent="center" p={3}>
         <Card style={{ width: '100%', maxWidth: 800, padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
            <CardContent>
               <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Create Report for Appointment
               </Typography>
               <Divider style={{ marginBottom: '20px' }} />

               <Box mb={3}>
                  <Typography variant="h6" fontWeight="bold">Patient Information</Typography>
                  <Grid container spacing={2} mt={1}>
                     <Grid item xs={6}>
                        <Typography variant="body1"><strong>Patient:</strong> {appointmentInfo.patient_first_name} {appointmentInfo.patient_last_name}</Typography>
                     </Grid>
                     <Grid item xs={6}>
                        <Typography variant="body1"><strong>Doctor:</strong> Dr. {appointmentInfo.doctor_first_name} {appointmentInfo.doctor_last_name}</Typography>
                     </Grid>
                     <Grid item xs={6}>
                        <Typography variant="body1"><strong>Appointment Date:</strong> {formatDate(appointmentInfo.reservation_start)}</Typography>
                     </Grid>
                     <Grid item xs={6}>
                        <Typography variant="body1"><strong>Appointment Time:</strong> {formatTime(appointmentInfo.reservation_start)} TO {formatTime(appointmentInfo.reservation_end)}</Typography>
                     </Grid>
                  </Grid>
               </Box>

               <Divider style={{ marginBottom: '20px' }} />

               <Box mb={3}>
                  <FormControlLabel
                     control={
                        <Checkbox
                           icon={<CheckBoxOutlineBlank />}
                           checkedIcon={<CheckBox />}
                           checked={diagnosisMade}
                           onChange={(e) => setDiagnosisMade(e.target.checked)}
                        />
                     }
                     label={<Typography variant="body1">Diagnosis Made</Typography>}
                  />
                  {diagnosisMade && (
                     <Box mt={2}>
                        <TextField
                           label="Diagnosis Name"
                           variant="outlined"
                           fullWidth
                           value={diagnosisName}
                           onChange={(e) => setDiagnosisName(e.target.value)}
                           style={{ marginBottom: '10px' }}
                        />
                        <TextField
                           label="Diagnosis Details"
                           variant="outlined"
                           multiline
                           rows={4}
                           fullWidth
                           value={diagnosisDetails}
                           onChange={(e) => setDiagnosisDetails(e.target.value)}
                        />
                     </Box>
                  )}
               </Box>

               <Box mb={3}>
                  <Typography variant="h6" fontWeight="bold">Examination Report</Typography>
                  <TextField
                     placeholder="Enter examination report..."
                     variant="outlined"
                     multiline
                     rows={4}
                     fullWidth
                     margin="normal"
                     value={reportContent}
                     onChange={(e) => setReportContent(e.target.value)}
                  />
               </Box>

               <Divider style={{ marginBottom: '20px' }} />

               <Box mb={3}>
                  <FormControlLabel
                     control={
                        <Checkbox
                           icon={<CheckBoxOutlineBlank />}
                           checkedIcon={<CheckBox />}
                           checked={referralNeeded}
                           onChange={(e) => setReferralNeeded(e.target.checked)}
                        />
                     }
                     label={<Typography variant="body1">Referral to Another Doctor Needed</Typography>}
                  />
                  {referralNeeded && (
                     <Box mt={2}>
                        <TextField
                           label="Specialty of Doctor to Refer"
                           variant="outlined"
                           fullWidth
                           value={referralSpecialty}
                           onChange={(e) => setReferralSpecialty(e.target.value)}
                           style={{ marginBottom: '10px' }}
                        />
                        <TextField
                           label="Name of Doctor to Refer To (optional)"
                           variant="outlined"
                           fullWidth
                           value={referralDoctorName}
                           onChange={(e) => setReferralDoctorName(e.target.value)}
                           style={{ marginBottom: '10px' }}
                        />
                        <TextField
                           label="Message to Referred Doctor"
                           variant="outlined"
                           multiline
                           rows={3}
                           fullWidth
                           value={referralMessage}
                           onChange={(e) => setReferralMessage(e.target.value)}
                        />
                     </Box>
                  )}
               </Box>

               <Divider style={{ marginBottom: '20px' }} />

               <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleSubmit}
                  style={{ padding: '12px 0', fontWeight: 'bold' }}
               >
                  Submit Report
               </Button>
            </CardContent>
         </Card>
      </Box>
   );
}

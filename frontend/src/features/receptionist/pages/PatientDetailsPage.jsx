import React, { useState, useEffect} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  MedicalServices as MedicalIcon,
  Assignment as AssignmentIcon,
  LocalPharmacy as PharmacyIcon,
  Event as EventIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import receptionistPatientService from '../services/receptionistPatientService';

const PatientDetailsPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignedDoctorId, setAssignedDoctorId] = useState(null);

  useEffect(() => {
    const doctorId = localStorage.getItem('assignedDoctorId');
    if (doctorId) {
      setAssignedDoctorId(doctorId);
    } else {
      setError('No assigned doctor found. Please contact administrator.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (patientId && assignedDoctorId) {
      fetchPatientDetails();
    }
  }, [patientId, assignedDoctorId]);

  const fetchPatientDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await receptionistPatientService.getPatientDetails(patientId);
      setPatient(response.patient);
      setAppointments(response.appointments || []);
    } catch (error) {
      console.error('Error fetching patient details:', error);
      setError(error.response?.data?.error || 'Failed to fetch patient details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/receptionist/patients');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'completed':
        return 'success';
      case 'canceled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!patient) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">Patient not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Patient Details
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                <Avatar
                  src={patient.profile_picture_url}
                  sx={{ width: 120, height: 120, mb: 2 }}
                >
                  <PersonIcon sx={{ fontSize: 60 }} />
                </Avatar>
                <Typography variant="h5" component="h2" gutterBottom>
                  {patient.firstName} {patient.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  @{patient.username}
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <List>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText primary="Email" secondary={patient.email} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText primary="Phone" secondary={patient.phoneNumber} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText primary="Age" secondary={`${patient.age} years old`} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary="Gender" secondary={patient.sex} />
                </ListItem>
                {patient.location && (
                  <ListItem>
                    <ListItemIcon>
                      <LocationIcon />
                    </ListItemIcon>
                    <ListItemText primary="Location" secondary={patient.location} />
                  </ListItem>
                )}
              </List>

              {patient.bio && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    About
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {patient.bio}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Typography variant="h5" gutterBottom>
            Appointments History
          </Typography>
          
          {appointments.length === 0 ? (
            <Card>
              <CardContent>
                <Box textAlign="center" py={4}>
                  <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No appointments found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This patient has no appointments with the assigned doctor.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Box>
              {appointments.map((appointment, index) => (
                <Accordion key={appointment.appointmentId} defaultExpanded={index === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" width="100%">
                      <Box flex={1}>
                        <Typography variant="h6">
                          {appointment.appointmentType || 'General Consultation'}
                        </Typography>
                        <Box display="flex" alignItems="center" mt={1}>
                          <TimeIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDateTime(appointment.appointmentStart)}
                          </Typography>
                          <Chip
                            label={appointment.status}
                            color={getStatusColor(appointment.status)}
                            size="small"
                            sx={{ ml: 2 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Appointment Details
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Doctor:</strong> Dr. {appointment.doctorFirstName} {appointment.doctorLastName}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Specialty:</strong> {appointment.doctorSpecialty}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Date & Time:</strong> {formatDateTime(appointment.appointmentStart)} - {formatDateTime(appointment.appointmentEnd)}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Type:</strong> {appointment.appointmentType}
                          </Typography>
                          {appointment.canceled && (
                            <>
                              <Typography variant="body2" paragraph>
                                <strong>Canceled by:</strong> {appointment.canceledBy}
                              </Typography>
                              {appointment.cancellationReason && (
                                <Typography variant="body2" paragraph>
                                  <strong>Reason:</strong> {appointment.cancellationReason}
                                </Typography>
                              )}
                            </>
                          )}
                        </Paper>
                      </Grid>
                      {appointment.hasMedicalReport && appointment.medicalReport && (
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Medical Report
                            </Typography>
                            {appointment.medicalReport.reportContent && (
                              <Typography variant="body2" paragraph>
                                <strong>Examination Report:</strong> {appointment.medicalReport.reportContent}
                              </Typography>
                            )}
                            {appointment.medicalReport.diagnosisName && (
                              <>
                                <Typography variant="body2" paragraph>
                                  <strong>Primary Diagnosis:</strong> {appointment.medicalReport.diagnosisName}
                                </Typography>
                                {appointment.medicalReport.diagnosisDetails && (
                                  <Typography variant="body2" paragraph>
                                    <strong>Diagnosis Details:</strong> {appointment.medicalReport.diagnosisDetails}
                                  </Typography>
                                )}
                              </>
                            )}
                            {appointment.medicalReport.referralNeeded && (
                              <Typography variant="body2" paragraph>
                                <strong>Referral Required:</strong> {appointment.medicalReport.referralSpecialty} - {appointment.medicalReport.referralDoctorName}
                                {appointment.medicalReport.referralMessage && (
                                  <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                    "{appointment.medicalReport.referralMessage}"
                                  </Typography>
                                )}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              Created: {formatDateTime(appointment.medicalReport.createdAt)}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}

                      {appointment.medicalHistory && appointment.medicalHistory.length > 0 && (
                        <Grid item xs={12}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              <MedicalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Medical History & Diagnosis
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Diagnosis</TableCell>
                                    <TableCell>Severity</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Treatment</TableCell>
                                    <TableCell>Date</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {appointment.medicalHistory.map((history) => (
                                    <TableRow key={history.id}>
                                      <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                          {history.diagnosisName}
                                        </Typography>
                                        {history.diagnosisDetails && (
                                          <Typography variant="caption" color="text.secondary" display="block">
                                            {history.diagnosisDetails}
                                          </Typography>
                                        )}
                                        {history.symptoms && (
                                          <Typography variant="caption" color="text.secondary" display="block">
                                            Symptoms: {history.symptoms}
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Chip 
                                          label={history.severity || 'Normal'} 
                                          size="small"
                                          color={
                                            history.severity === 'severe' ? 'error' : 
                                            history.severity === 'moderate' ? 'warning' : 
                                            history.severity === 'mild' ? 'info' : 'success'
                                          }
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Chip 
                                          label={history.status || 'Active'} 
                                          size="small"
                                          variant="outlined"
                                          color={
                                            history.status === 'resolved' ? 'success' :
                                            history.status === 'chronic' ? 'warning' :
                                            history.status === 'active' ? 'primary' : 'default'
                                          }
                                        />
                                      </TableCell>
                                      <TableCell>
                                        {history.treatmentPlan && (
                                          <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                            {history.treatmentPlan}
                                          </Typography>
                                        )}
                                        {history.medications && history.medications.length > 0 && (
                                          <Typography variant="caption" color="primary" display="block">
                                            {history.medications.length} medication(s) prescribed
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2">
                                          {formatDate(history.diagnosisDate || history.diagnosis_date)}
                                        </Typography>
                                        {history.followUpDate && (
                                          <Typography variant="caption" color="text.secondary" display="block">
                                            Follow-up: {formatDate(history.followUpDate)}
                                          </Typography>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Paper>
                        </Grid>
                      )}

                      {(!appointment.medicalHistory || appointment.medicalHistory.length === 0) && appointment.diagnosisHistory && appointment.diagnosisHistory.length > 0 && (
                        <Grid item xs={12}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              <MedicalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Diagnosis History (Legacy)
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Diagnosis</TableCell>
                                    <TableCell>Severity</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Date</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {appointment.diagnosisHistory.map((diagnosis) => (
                                    <TableRow key={diagnosis.id}>
                                      <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                          {diagnosis.diagnosisName}
                                        </Typography>
                                        {diagnosis.diagnosisDetails && (
                                          <Typography variant="caption" color="text.secondary">
                                            {diagnosis.diagnosisDetails}
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Chip 
                                          label={diagnosis.severity} 
                                          size="small"
                                          color={diagnosis.severity === 'severe' ? 'error' : diagnosis.severity === 'moderate' ? 'warning' : 'success'}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Chip 
                                          label={diagnosis.status} 
                                          size="small"
                                          variant="outlined"
                                        />
                                      </TableCell>
                                      <TableCell>{formatDate(diagnosis.diagnosis_date)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Paper>
                        </Grid>
                      )}

                      {appointment.medications && appointment.medications.length > 0 && (
                        <Grid item xs={12}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              <PharmacyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Prescribed Medications
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Medication</TableCell>
                                    <TableCell>Dosage</TableCell>
                                    <TableCell>Frequency</TableCell>
                                    <TableCell>Duration</TableCell>
                                    <TableCell>Instructions</TableCell>
                                    <TableCell>Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {appointment.medications.map((medication, index) => (
                                    <TableRow key={medication.id || index}>
                                      <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                          {medication.medicationName}
                                        </Typography>
                                        {medication.medicationType && (
                                          <Typography variant="caption" color="text.secondary" display="block">
                                            Type: {medication.medicationType}
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2">
                                          {medication.dosage}
                                        </Typography>
                                        {medication.dosageUnit && (
                                          <Typography variant="caption" color="text.secondary">
                                            {medication.dosageUnit}
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2">
                                          {medication.frequency}
                                        </Typography>
                                        {medication.frequencyTimes && (
                                          <Typography variant="caption" color="text.secondary" display="block">
                                            {medication.frequencyTimes} times
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2">
                                          {medication.duration}
                                        </Typography>
                                        {medication.startDate && (
                                          <Typography variant="caption" color="text.secondary" display="block">
                                            From: {formatDate(medication.startDate)}
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {medication.instructions && (
                                          <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                            {medication.instructions}
                                          </Typography>
                                        )}
                                        {medication.specialInstructions && (
                                          <Typography variant="caption" color="primary" display="block" sx={{ mt: 0.5 }}>
                                            ⚠️ {medication.specialInstructions}
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Chip 
                                          label={medication.isActive !== false ? 'Active' : 'Completed'} 
                                          size="small"
                                          color={medication.isActive !== false ? 'success' : 'default'}
                                        />
                                        {medication.endDate && new Date(medication.endDate) < new Date() && (
                                          <Typography variant="caption" color="text.secondary" display="block">
                                            Ended: {formatDate(medication.endDate)}
                                          </Typography>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Paper>
                        </Grid>
                      )}

                      {(!appointment.medications || appointment.medications.length === 0) && appointment.prescribedMedicines && appointment.prescribedMedicines.length > 0 && (
                        <Grid item xs={12}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              <PharmacyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Prescribed Medicines (Legacy)
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Medicine</TableCell>
                                    <TableCell>Dosage</TableCell>
                                    <TableCell>Frequency</TableCell>
                                    <TableCell>Duration</TableCell>
                                    <TableCell>Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {appointment.prescribedMedicines.map((medicine) => (
                                    <TableRow key={medicine.id}>
                                      <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                          {medicine.medicationName}
                                        </Typography>
                                        {medicine.instructions && (
                                          <Typography variant="caption" color="text.secondary">
                                            {medicine.instructions}
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>{medicine.dosage}</TableCell>
                                      <TableCell>{medicine.frequency}</TableCell>
                                      <TableCell>{medicine.duration}</TableCell>
                                      <TableCell>
                                        <Chip 
                                          label={medicine.isActive ? 'Active' : 'Completed'} 
                                          size="small"
                                          color={medicine.isActive ? 'success' : 'default'}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default PatientDetailsPage;

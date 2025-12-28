import React, { useState, useEffect} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation(['common', 'medical', 'appointments']);
  const locale = i18n?.language || undefined;
  
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
      setError(t('receptionist.errors.noAssignedDoctor'));
      setLoading(false);
    }
  }, [t]);

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
      setError(error.response?.data?.error || t('receptionist.patientDetails.errors.fetchFailed'));
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
    return new Date(dateString).toLocaleString(locale);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(locale);
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
        <Alert severity="warning">{t('receptionist.patientDetails.notFound')}</Alert>
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
            {t('receptionist.patientDetails.title')}
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
                  <ListItemText primary={t('common.email')} secondary={patient.email} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('common.phone')} secondary={patient.phoneNumber} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('patient.fields.age')}
                    secondary={t('patient.yearsOld', { age: patient.age, defaultValue: `${patient.age} years old` })}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('patient.fields.gender')} secondary={patient.sex} />
                </ListItem>
                {patient.location && (
                  <ListItem>
                    <ListItemIcon>
                      <LocationIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('medical:terms.clinicLocation')} secondary={patient.location} />
                  </ListItem>
                )}
              </List>

              {patient.bio && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {t('receptionist.patientDetails.about')}
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
            {t('receptionist.patientDetails.appointmentsHistory')}
          </Typography>
          
          {appointments.length === 0 ? (
            <Card>
              <CardContent>
                <Box textAlign="center" py={4}>
                  <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t('receptionist.patientDetails.noAppointments.title')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('receptionist.patientDetails.noAppointments.subtitle')}
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
                          {appointment.appointmentType || t('receptionist.patientDetails.defaultAppointmentType')}
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
                            {t('appointments:card.appointmentDetails')}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>{t('medical:terms.doctor')}:</strong> {t('labels.doctor', { ns: 'medical', name: `${appointment.doctorFirstName} ${appointment.doctorLastName}`.trim(), defaultValue: `Dr. ${appointment.doctorFirstName} ${appointment.doctorLastName}` })}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>{t('medical:terms.specialty')}:</strong> {appointment.doctorSpecialty}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>{t('receptionist.patientDetails.labels.dateTime')}:</strong> {formatDateTime(appointment.appointmentStart)} - {formatDateTime(appointment.appointmentEnd)}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>{t('common.type')}:</strong> {appointment.appointmentType}
                          </Typography>
                          {appointment.canceled && (
                            <>
                              <Typography variant="body2" paragraph>
                                <strong>{t('receptionist.patientDetails.labels.canceledBy')}:</strong> {appointment.canceledBy}
                              </Typography>
                              {appointment.cancellationReason && (
                                <Typography variant="body2" paragraph>
                                  <strong>{t('receptionist.patientDetails.labels.cancellationReason')}:</strong> {appointment.cancellationReason}
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
                              {t('receptionist.patientDetails.medicalReport.title')}
                            </Typography>
                            {appointment.medicalReport.reportContent && (
                              <Typography variant="body2" paragraph>
                                <strong>{t('receptionist.patientDetails.medicalReport.examinationReport')}:</strong> {appointment.medicalReport.reportContent}
                              </Typography>
                            )}
                            {appointment.medicalReport.diagnosisName && (
                              <>
                                <Typography variant="body2" paragraph>
                                  <strong>{t('receptionist.patientDetails.medicalReport.primaryDiagnosis')}:</strong> {appointment.medicalReport.diagnosisName}
                                </Typography>
                                {appointment.medicalReport.diagnosisDetails && (
                                  <Typography variant="body2" paragraph>
                                    <strong>{t('receptionist.patientDetails.medicalReport.diagnosisDetails')}:</strong> {appointment.medicalReport.diagnosisDetails}
                                  </Typography>
                                )}
                              </>
                            )}
                            {appointment.medicalReport.referralNeeded && (
                              <Typography variant="body2" paragraph>
                                <strong>{t('receptionist.patientDetails.medicalReport.referralRequired')}:</strong> {appointment.medicalReport.referralSpecialty} - {appointment.medicalReport.referralDoctorName}
                                {appointment.medicalReport.referralMessage && (
                                  <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                    "{appointment.medicalReport.referralMessage}"
                                  </Typography>
                                )}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {t('receptionist.patientDetails.medicalReport.created')}: {formatDateTime(appointment.medicalReport.createdAt)}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}

                      {appointment.medicalHistory && appointment.medicalHistory.length > 0 && (
                        <Grid item xs={12}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              <MedicalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                              {t('receptionist.patientDetails.medicalHistory.title')}
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>{t('medical:terms.diagnosis')}</TableCell>
                                    <TableCell>{t('receptionist.patientDetails.medicalHistory.severity')}</TableCell>
                                    <TableCell>{t('common.status')}</TableCell>
                                    <TableCell>{t('medical:terms.treatment')}</TableCell>
                                    <TableCell>{t('common.date')}</TableCell>
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
                                            {t('medical:terms.symptoms')}: {history.symptoms}
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Chip 
                                          label={history.severity || t('receptionist.patientDetails.medicalHistory.severityDefault')} 
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
                                          label={history.status || t('status.active')} 
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
                                            {t('receptionist.patientDetails.medicalHistory.medicationsPrescribed', { count: history.medications.length })}
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2">
                                          {formatDate(history.diagnosisDate || history.diagnosis_date)}
                                        </Typography>
                                        {history.followUpDate && (
                                          <Typography variant="caption" color="text.secondary" display="block">
                                            {t('receptionist.patientDetails.medicalHistory.followUp')}: {formatDate(history.followUpDate)}
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
                              {t('receptionist.patientDetails.diagnosisHistoryLegacy')}
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>{t('medical:terms.diagnosis')}</TableCell>
                                    <TableCell>{t('receptionist.patientDetails.medicalHistory.severity')}</TableCell>
                                    <TableCell>{t('common.status')}</TableCell>
                                    <TableCell>{t('common.date')}</TableCell>
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
                              {t('receptionist.patientDetails.prescribedMedications')}
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>{t('medical:terms.medication')}</TableCell>
                                    <TableCell>{t('medical:terms.dosage')}</TableCell>
                                    <TableCell>{t('receptionist.patientDetails.medications.frequency')}</TableCell>
                                    <TableCell>{t('receptionist.patientDetails.medications.duration')}</TableCell>
                                    <TableCell>{t('receptionist.patientDetails.medications.instructions')}</TableCell>
                                    <TableCell>{t('common.status')}</TableCell>
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
                                            {t('common.type')}: {medication.medicationType}
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
                                            {t('receptionist.patientDetails.medications.times', { count: medication.frequencyTimes })}
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2">
                                          {medication.duration}
                                        </Typography>
                                        {medication.startDate && (
                                          <Typography variant="caption" color="text.secondary" display="block">
                                            {t('receptionist.patientDetails.medications.from')}: {formatDate(medication.startDate)}
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
                                          label={medication.isActive !== false ? t('status.active') : t('status.completed')} 
                                          size="small"
                                          color={medication.isActive !== false ? 'success' : 'default'}
                                        />
                                        {medication.endDate && new Date(medication.endDate) < new Date() && (
                                          <Typography variant="caption" color="text.secondary" display="block">
                                            {t('receptionist.patientDetails.medications.ended')}: {formatDate(medication.endDate)}
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
                              {t('receptionist.patientDetails.prescribedMedicinesLegacy')}
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>{t('medical:terms.medication')}</TableCell>
                                    <TableCell>{t('medical:terms.dosage')}</TableCell>
                                    <TableCell>{t('receptionist.patientDetails.medications.frequency')}</TableCell>
                                    <TableCell>{t('receptionist.patientDetails.medications.duration')}</TableCell>
                                    <TableCell>{t('common.status')}</TableCell>
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
                                          label={medicine.isActive ? t('status.active') : t('status.completed')} 
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

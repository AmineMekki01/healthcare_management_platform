import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import receptionistPatientService from '../services/receptionistPatientService';

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [patientStats, setPatientStats] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const [assignedDoctorId, setAssignedDoctorId] = useState(null);
  const [doctorName, setDoctorName] = useState('');
  const [userFullName, setUserFullName] = useState('');

  useEffect(() => {
    const doctorId = localStorage.getItem('assignedDoctorId');
    const doctorNameFromStorage = localStorage.getItem('assignedDoctorName');
    const fullName = localStorage.getItem('userFullName');
    
    if (doctorId) {
      setAssignedDoctorId(doctorId);
      setDoctorName(doctorNameFromStorage || 'Unknown Doctor');
      setUserFullName(fullName || 'Receptionist');
      fetchDashboardData();
    } else {
      setError(t('receptionist.errors.noAssignedDoctor'));
      setLoading(false);
    }
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const recentPatientsResponse = await receptionistPatientService.searchPatients({
        page: 1,
        page_size: 5,
        search_term: ''
      });

      setPatientStats({
        total: recentPatientsResponse.data.total || 0,
        thisMonth: 0,
        thisWeek: 0
      });
      
      setAppointmentStats({
        today: 0,
        pending: 0,
        thisWeek: 0
      });
      
      setRecentPatients(recentPatientsResponse.data.patients || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.error || t('receptionist.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPatients = () => {
    navigate('/receptionist/patients');
  };

  const handleCreatePatient = () => {
    navigate('/receptionist/create-patient');
  };

  const handleCreateAppointment = () => {
    navigate('/receptionist/create-appointment');
  };

  const handleViewPatient = (patientId) => {
    navigate(`/receptionist/patients/${patientId}`);
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <DashboardIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          {t('navigation.receptionistDashboard')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('receptionist.welcome', { name: userFullName, doctor: doctorName })}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('receptionist.quickActions')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearchPatients}
                sx={{ py: 2 }}
              >
                {t('navigation.patientSearch')}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={handleCreatePatient}
                sx={{ py: 2 }}
              >
                {t('receptionist.actions.addNewPatient')}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EventIcon />}
                onClick={handleCreateAppointment}
                sx={{ py: 2 }}
              >
                {t('navigation.scheduleAppointment')}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="text"
                startIcon={<TrendingUpIcon />}
                onClick={() => {/* Navigate to reports */}}
                sx={{ py: 2 }}
              >
                {t('receptionist.actions.viewReports')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {t('receptionist.stats.appointments')}
              </Typography>
              
              {appointmentStats ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                      <Typography variant="h4">{appointmentStats.todayAppointments}</Typography>
                      <Typography variant="body2">{t('common.today')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                      <Typography variant="h4">{appointmentStats.upcomingAppointments}</Typography>
                      <Typography variant="body2">{t('receptionist.stats.upcoming')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                      <Typography variant="h4">{appointmentStats.completedAppointments}</Typography>
                      <Typography variant="body2">{t('status.completed')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                      <Typography variant="h4">{appointmentStats.totalAppointments}</Typography>
                      <Typography variant="body2">{t('common.total')}</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary">{t('receptionist.noData.appointments')}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {t('receptionist.stats.patients')}
              </Typography>
              
              {patientStats ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
                      <Typography variant="h4">{patientStats.newPatientsToday}</Typography>
                      <Typography variant="body2">{t('receptionist.stats.newToday')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                      <Typography variant="h4">{patientStats.activePatients}</Typography>
                      <Typography variant="body2">{t('status.active')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
                      <Typography variant="h4">{patientStats.newPatientsWeek}</Typography>
                      <Typography variant="body2">{t('receptionist.stats.thisWeek')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
                      <Typography variant="h4">{patientStats.totalPatients}</Typography>
                      <Typography variant="body2">{t('common.total')}</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary">{t('receptionist.noData.patients')}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {t('receptionist.recentPatients')}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleSearchPatients}
                  startIcon={<SearchIcon />}
                >
                  {t('actions.viewAll')}
                </Button>
              </Box>

              {recentPatients.length > 0 ? (
                <List>
                  {recentPatients.map((patient, index) => (
                    <React.Fragment key={patient.patientId}>
                      <ListItem
                        secondaryAction={
                          <Box>
                            <Chip
                              label={patient.hasActiveAppointments ? t('status.active') : t('status.inactive')}
                              color={patient.hasActiveAppointments ? 'success' : 'default'}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <IconButton
                              onClick={() => handleViewPatient(patient.patientId)}
                              size="small"
                            >
                              <SearchIcon />
                            </IconButton>
                          </Box>
                        }
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleViewPatient(patient.patientId)}
                      >
                        <ListItemIcon>
                          <PeopleIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${patient.firstName} ${patient.lastName}`}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {patient.email} • {patient.phoneNumber}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {t('patient.fields.lastVisit')}: {patient.lastAppointmentDate ? new Date(patient.lastAppointmentDate).toLocaleDateString() : t('patient.fields.never')} •
                                {t('receptionist.totalAppointments')}: {patient.totalAppointments}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentPatients.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={4}>
                  <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    {t('patient.noResults.title')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('receptionist.noPatients.description')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReceptionistDashboard;

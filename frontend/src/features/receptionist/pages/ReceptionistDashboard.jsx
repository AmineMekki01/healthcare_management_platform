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
  Chip,
  Stack
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
  WorkOutline as WorkOutlineIcon,
  MailOutline as MailOutlineIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import receptionistPatientService from '../services/receptionistPatientService';
import receptionistHiringService from '../services/receptionistHiringService';
import appointmentService from '../../appointments/services/appointmentService';

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [patientStats, setPatientStats] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pendingOffersCount, setPendingOffersCount] = useState(0);
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
      const receptionistId = localStorage.getItem('receptionistId') || localStorage.getItem('userId');
      const effectiveDoctorId = localStorage.getItem('assignedDoctorId') || assignedDoctorId;

      const [recentPatientsResponse, apptStats, patStats, reservations, proposals] = await Promise.all([
        receptionistPatientService.searchPatients({
          page: 1,
          page_size: 5,
          search_term: ''
        }),
        receptionistPatientService.getAppointmentStats(),
        receptionistPatientService.getPatientStats(),
        effectiveDoctorId ? appointmentService.fetchReservations(effectiveDoctorId, 'doctor') : Promise.resolve([]),
        receptionistId ? receptionistHiringService.listProposals(receptionistId) : Promise.resolve([]),
      ]);

      setAppointmentStats(apptStats || null);
      setPatientStats(patStats || null);

      const now = new Date();
      const upcoming = (Array.isArray(reservations) ? reservations : [])
        .filter((r) => !r?.isDoctorPatient && !r?.canceled && new Date(r?.appointmentEnd || r?.appointmentStart) > now)
        .sort((a, b) => new Date(a.appointmentStart) - new Date(b.appointmentStart))
        .slice(0, 6);
      setUpcomingAppointments(upcoming);

      const pending = (Array.isArray(proposals) ? proposals : []).filter(
        (p) => String(p?.status || '').toLowerCase() === 'sent'
      ).length;
      setPendingOffersCount(pending);

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

  const handleViewJobOffers = () => {
    navigate('/receptionist/job-offers');
  };

  const handleViewMessages = () => {
    navigate('/Messages');
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
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
            {t('receptionist.quickActions')}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchDashboardData}
              disabled={loading}
            >
              {t('buttons.refresh')}
            </Button>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
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
            <Grid item xs={12} sm={6} md={4}>
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
            <Grid item xs={12} sm={6} md={4}>
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
            <Grid item xs={12} sm={6} md={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<WorkOutlineIcon />}
                onClick={handleViewJobOffers}
                sx={{ py: 2 }}
              >
                {t('receptionist.jobOffers.title')}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<MailOutlineIcon />}
                onClick={handleViewMessages}
                sx={{ py: 2 }}
              >
                {t('navigation.messages')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {t('receptionist.dashboard.upcomingAppointments')}
                </Typography>
                <Button variant="outlined" size="small" onClick={handleCreateAppointment}>
                  {t('navigation.scheduleAppointment')}
                </Button>
              </Box>

              {upcomingAppointments.length === 0 ? (
                <Typography color="text.secondary">{t('receptionist.dashboard.noUpcomingAppointments')}</Typography>
              ) : (
                <List dense>
                  {upcomingAppointments.map((a, idx) => {
                    const start = a?.appointmentStart ? new Date(a.appointmentStart) : null;
                    const end = a?.appointmentEnd ? new Date(a.appointmentEnd) : null;
                    const primary = `${a?.patientFirstName || ''} ${a?.patientLastName || ''}`.trim() || t('patient.fields.never');
                    const secondary = start
                      ? `${start.toLocaleDateString()} • ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${end ? ` - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}`
                      : '';

                    return (
                      <React.Fragment key={a?.appointmentId || idx}>
                        <ListItem
                          secondaryAction={
                            <Stack direction="row" spacing={1} alignItems="center">
                              {!!a?.specialty && <Chip size="small" label={a.specialty} variant="outlined" />}
                              <Chip
                                size="small"
                                color="success"
                                label={t('status.active')}
                              />
                            </Stack>
                          }
                        >
                          <ListItemIcon>
                            <PeopleIcon />
                          </ListItemIcon>
                          <ListItemText primary={primary} secondary={secondary} />
                        </ListItem>
                        {idx < upcomingAppointments.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {t('receptionist.dashboard.insights')}
              </Typography>

              <Stack spacing={2}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('receptionist.jobOffers.status.sent')}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {pendingOffersCount}
                  </Typography>
                  <Button size="small" sx={{ mt: 1 }} onClick={handleViewJobOffers}>
                    {t('receptionist.dashboard.viewJobOffers')}
                  </Button>
                </Paper>

                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('receptionist.dashboard.assignedDoctor')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {doctorName}
                  </Typography>
                </Paper>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {t('receptionist.stats.appointments')}
              </Typography>
              
              {appointmentStats ? (
                <Grid container spacing={2}>
                  <Grid item xs={6} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                      <Typography variant="h4">{appointmentStats.todayAppointments ?? 0}</Typography>
                      <Typography variant="body2">{t('common.today')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                      <Typography variant="h4">{appointmentStats.upcomingAppointments ?? 0}</Typography>
                      <Typography variant="body2">{t('receptionist.stats.upcoming')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                      <Typography variant="h4">{appointmentStats.completedAppointments ?? 0}</Typography>
                      <Typography variant="body2">{t('status.completed')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
                      <Typography variant="h4">{appointmentStats.canceledAppointments ?? 0}</Typography>
                      <Typography variant="body2">{t('status.cancelled')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                      <Typography variant="h4">{appointmentStats.noShowAppointments ?? 0}</Typography>
                      <Typography variant="body2">{t('receptionist.dashboard.noShows')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                      <Typography variant="h4">{appointmentStats.totalAppointments ?? 0}</Typography>
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
                  <Grid item xs={6} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
                      <Typography variant="h4">{patientStats.newPatientsToday ?? 0}</Typography>
                      <Typography variant="body2">{t('receptionist.stats.newToday')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                      <Typography variant="h4">{patientStats.activePatients ?? 0}</Typography>
                      <Typography variant="body2">{t('status.active')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
                      <Typography variant="h4">{patientStats.newPatientsWeek ?? 0}</Typography>
                      <Typography variant="body2">{t('receptionist.stats.thisWeek')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                      <Typography variant="h4">{patientStats.newPatientsMonth ?? 0}</Typography>
                      <Typography variant="body2">{t('receptionist.dashboard.thisMonth')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                      <Typography variant="h4">{patientStats.inactivePatients ?? 0}</Typography>
                      <Typography variant="body2">{t('status.inactive')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
                      <Typography variant="h4">{patientStats.totalPatients ?? 0}</Typography>
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

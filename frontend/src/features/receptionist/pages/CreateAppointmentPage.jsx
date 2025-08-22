import React, { useState, useEffect} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  CardContent,
  Card,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Autocomplete,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Event as EventIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import receptionistPatientService from '../services/receptionistPatientService';

const CreateAppointmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [assignedDoctorId, setAssignedDoctorId] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availability, setAvailability] = useState([]);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [conflictDialog, setConflictDialog] = useState({ open: false, conflicts: [] });
  
  const preSelectedPatient = location.state?.patient;
  
  const [formData, setFormData] = useState({
    patientId: preSelectedPatient?.patientId || '',
    appointmentStart: null,
    appointmentEnd: null,
    appointmentType: 'consultation',
    notes: ''
  });
  
  const appointmentTypes = [
    { value: 'consultation', label: 'General Consultation' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'checkup', label: 'Regular Checkup' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'procedure', label: 'Medical Procedure' },
    { value: 'diagnostic', label: 'Diagnostic Test' }
  ];

  const [selectedPatient, setSelectedPatient] = useState(preSelectedPatient || null);

  useEffect(() => {
    const doctorId = localStorage.getItem('assignedDoctorId');
    if (doctorId) {
      setAssignedDoctorId(doctorId);
    } else {
      setError('No assigned doctor found. Please contact administrator.');
    }

    if (preSelectedPatient) {
      setShowCalendar(true);
    }
  }, []);

  useEffect(() => {
    if (assignedDoctorId && !preSelectedPatient) {
      fetchPatients();
    }
  }, [assignedDoctorId, preSelectedPatient]);

  useEffect(() => {
    if (assignedDoctorId && selectedPatient) {
      fetchDoctorAvailability();
      fetchExistingAppointments();
    }
  }, [selectedDate, assignedDoctorId, selectedPatient]);

  const fetchPatients = async (searchQuery = '') => {
    if (!assignedDoctorId) return;

    setLoadingPatients(true);
    try {
      const searchRequest = {
        page: 1,
        page_size: 100,
        search_term: searchQuery
      };
      
      const response = await receptionistPatientService.searchPatients(searchRequest);
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Failed to load patients: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchDoctorAvailability = async () => {
    if (!selectedDate || !assignedDoctorId) return;

    setLoadingAvailability(true);
    try {
      const dayString = selectedDate.toISOString().split('T')[0];
      const availabilityData = await receptionistPatientService.getDoctorAvailability(dayString);
      setAvailability(availabilityData || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setError('Failed to load availability: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoadingAvailability(false);
    }
  };

  const fetchExistingAppointments = async () => {
    if (!selectedDate || !assignedDoctorId) return;

    try {
      const dayString = selectedDate.toISOString().split('T')[0];
      const appointmentsData = await receptionistPatientService.getDoctorAppointments(dayString, dayString);
      setExistingAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error fetching existing appointments:', error);
    }
  };

  const isTimeSlotConflicted = (slotStart, slotEnd) => {
    return existingAppointments.some(appointment => {
      if (appointment.Canceled || appointment.canceled) return false;
      
      const appointmentStart = new Date(appointment.reservationStart || appointment.appointmentStart);
      const appointmentEnd = new Date(appointment.reservationEnd || appointment.appointmentEnd);
      const checkStart = new Date(slotStart);
      const checkEnd = new Date(slotEnd);
      
      return (
        (checkStart < appointmentEnd && checkEnd > appointmentStart) ||
        (checkStart >= appointmentStart && checkStart < appointmentEnd) ||
        (checkEnd > appointmentStart && checkEnd <= appointmentEnd)
      );
    });
  };

  const handleBack = () => {
    if (preSelectedPatient) {
      navigate(`/receptionist/patients/${preSelectedPatient.patientId}`);
    } else {
      navigate('/receptionist/patients');
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setFormData({
      ...formData,
      appointmentStart: null,
      appointmentEnd: null
    });
  };

  const handleTimeSlotSelect = (slot) => {
    const startTime = new Date(slot.availabilityStart);
    const endTime = new Date(slot.availabilityEnd);

    if (isTimeSlotConflicted(startTime, endTime)) {
      const conflictingAppointments = existingAppointments.filter(apt => {
        if (apt.Canceled || apt.canceled) return false;
        const aptStart = new Date(apt.reservationStart || apt.appointmentStart);
        const aptEnd = new Date(apt.reservationEnd || apt.appointmentEnd);
        return (startTime < aptEnd && endTime > aptStart);
      });
      
      setConflictDialog({
        open: true,
        conflicts: conflictingAppointments
      });
      return;
    }

    setSelectedTimeSlot(slot);
    setFormData({
      ...formData,
      appointmentStart: startTime,
      appointmentEnd: endTime
    });
  };

  const handlePatientChange = (event, newValue) => {
    setSelectedPatient(newValue);
    setFormData({
      ...formData,
      patientId: newValue ? newValue.patientId : ''
    });
    setShowCalendar(!!newValue);
  };

  const validateForm = () => {
    if (!formData.patientId) return 'Please select a patient';
    if (!formData.appointmentStart) return 'Please select appointment start time';
    if (!formData.appointmentEnd) return 'Please select appointment end time';
    if (formData.appointmentStart >= formData.appointmentEnd) return 'End time must be after start time';
    if (!formData.appointmentType) return 'Please select appointment type';
    
    if (formData.appointmentStart < new Date()) return 'Appointment cannot be scheduled in the past';
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const conflicts = await receptionistPatientService.checkAppointmentConflict(
        formData.appointmentStart.toISOString(),
        formData.appointmentEnd.toISOString()
      );
      
      if (conflicts && conflicts.length > 0) {
        setError('Appointment time conflicts with existing appointment. Please select a different time.');
        setLoading(false);
        return;
      }

      const submitData = {
        ...formData,
        doctorId: assignedDoctorId,
        appointmentStart: formData.appointmentStart.toISOString(),
        appointmentEnd: formData.appointmentEnd.toISOString(),
        ...(selectedTimeSlot && {
          availabilityId: selectedTimeSlot.availabilityId,
          date: selectedDate.toISOString().split('T')[0],
          time: formatTime(selectedTimeSlot.availabilityStart)
        })
      };
      
      console.log('Submitting appointment data:', submitData);
      
      try {
        const response = await receptionistPatientService.createAppointment(submitData);
        setSuccess('Appointment created successfully!');
        
        setTimeout(() => {
          navigate(`/receptionist/patients/${formData.patientId}`);
        }, 2000);
        
      } catch (receptionistError) {
        console.log('Receptionist endpoint failed :', receptionistError);
      }
      
    } catch (error) {
      console.error('Error creating appointment:', error);
      setError(error.response?.data?.error || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isSlotAvailable = (slot) => {
    return !isTimeSlotConflicted(
      slot.availabilityStart,
      slot.availabilityEnd
    );
  };

  const shouldShowCalendar = (selectedPatient || preSelectedPatient) && assignedDoctorId;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <IconButton onClick={handleBack} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Create New Appointment
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Schedule a new appointment for a patient
          </Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <EventIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">
                  Appointment Details
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  {preSelectedPatient ? (
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Box display="flex" alignItems="center">
                        <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="h6">
                            {preSelectedPatient.firstName} {preSelectedPatient.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {preSelectedPatient.email} • {preSelectedPatient.phoneNumber}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ) : (
                    <Autocomplete
                      options={patients}
                      getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                      value={selectedPatient}
                      onChange={handlePatientChange}
                      onInputChange={(event, newInputValue) => {
                        if (newInputValue.length > 2) {
                          fetchPatients(newInputValue);
                        }
                      }}
                      loading={loadingPatients}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Patient *"
                          required
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loadingPatients && <CircularProgress color="inherit" size={20} />}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box>
                            <Typography variant="body1">
                              {option.firstName} {option.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {option.email} • Age: {option.age} • {option.sex}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    />
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl required fullWidth>
                    <InputLabel>Appointment Type</InputLabel>
                    <Select
                      value={formData.appointmentType}
                      label="Appointment Type"
                      onChange={handleInputChange('appointmentType')}
                    >
                      {appointmentTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={handleInputChange('notes')}
                    placeholder="Additional notes or special instructions for the appointment..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {shouldShowCalendar && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <CalendarIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Select Appointment Date & Time
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <DatePicker
                      label="Appointment Date"
                      value={selectedDate}
                      onChange={handleDateChange}
                      minDate={new Date()}
                      maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={8}>
                    <Typography variant="subtitle1" gutterBottom>
                      Available Time Slots
                    </Typography>
                    
                    {loadingAvailability ? (
                      <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                      </Box>
                    ) : availability.length > 0 ? (
                      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                        <Grid container spacing={1}>
                          {availability.map((slot) => {
                            const isAvailable = isSlotAvailable(slot);
                            const isSelected = selectedTimeSlot?.availabilityId === slot.availabilityId || selectedTimeSlot?.availabilityId === slot.availabilityId;
                            
                            return (
                              <Grid item xs={6} sm={4} md={3} key={slot.availabilityId || slot.availabilityId}>
                                <Paper
                                  sx={{
                                    p: 1.5,
                                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                                    bgcolor: isSelected 
                                      ? 'primary.main' 
                                      : isAvailable 
                                        ? 'background.paper' 
                                        : 'grey.200',
                                    color: isSelected 
                                      ? 'white' 
                                      : isAvailable 
                                        ? 'text.primary' 
                                        : 'text.disabled',
                                    border: 1,
                                    borderColor: isSelected 
                                      ? 'primary.main' 
                                      : isAvailable 
                                        ? 'primary.light' 
                                        : 'grey.300',
                                    '&:hover': isAvailable ? {
                                      bgcolor: isSelected 
                                        ? 'primary.dark' 
                                        : 'primary.light',
                                      color: 'white'
                                    } : {}
                                  }}
                                  onClick={() => isAvailable && handleTimeSlotSelect(slot)}
                                >
                                  <Box display="flex" flexDirection="column" alignItems="center">
                                    <Typography variant="body2" fontWeight="bold">
                                      {formatTime(slot.availabilityStart)}
                                    </Typography>
                                    <Typography variant="caption">
                                      {formatTime(slot.availabilityEnd)}
                                    </Typography>
                                    {!isAvailable && (
                                      <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5 }}>
                                        Booked
                                      </Typography>
                                    )}
                                  </Box>
                                </Paper>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Box>
                    ) : (
                      <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                        <Typography variant="body2" color="text.secondary" align="center">
                          No available time slots for this date.
                          <br />
                          Please select a different date.
                        </Typography>
                      </Paper>
                    )}
                  </Grid>
                </Grid>

                {selectedTimeSlot && formData.appointmentStart && formData.appointmentEnd && (
                  <Box mt={3}>
                    <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                      <Box display="flex" alignItems="center">
                        <TimeIcon sx={{ mr: 2 }} />
                        <Box>
                          <Typography variant="h6">
                            Selected Time
                          </Typography>
                          <Typography variant="body1">
                            {selectedDate.toLocaleDateString()} at {formatTime(formData.appointmentStart)} - {formatTime(formData.appointmentEnd)}
                          </Typography>
                          <Typography variant="body2">
                            Duration: {Math.round((formData.appointmentEnd - formData.appointmentStart) / (1000 * 60))} minutes
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                )}

                {existingAppointments.length > 0 && (
                  <Box mt={3}>
                    <Typography variant="subtitle2" gutterBottom>
                      Existing Appointments Today ({existingAppointments.filter(apt => !apt.Canceled && !apt.canceled).length})
                    </Typography>
                    <List dense sx={{ maxHeight: 150, overflow: 'auto', bgcolor: 'grey.50', borderRadius: 1 }}>
                      {existingAppointments
                        .filter(apt => !apt.Canceled && !apt.canceled)
                        .sort((a, b) => new Date(a.reservationStart || a.appointmentStart) - new Date(b.reservationStart || b.appointmentStart))
                        .map((apt, index) => (
                        <React.Fragment key={apt.appointmentId || apt.reservation_id || index}>
                          <ListItem>
                            <ListItemText
                              primary={`${formatTime(apt.reservationStart || apt.appointmentStart)} - ${formatTime(apt.reservationEnd || apt.appointmentEnd)}`}
                              secondary={`${apt.patientFirstName || apt.patientFirstName} ${apt.patientLastName || apt.patientLastName} • ${apt.appointmentType || apt.appointmentType || 'Appointment'}`}
                            />
                          </ListItem>
                          {index < existingAppointments.filter(apt => !apt.Canceled && !apt.canceled).length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          <Box display="flex" justifyContent="flex-end" mt={4}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !formData.patientId || !formData.appointmentStart || !selectedTimeSlot}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {loading ? 'Creating...' : 'Create Appointment'}
            </Button>
          </Box>
        </form>

        <Dialog
          open={conflictDialog.open}
          onClose={() => setConflictDialog({ open: false, conflicts: [] })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
              Time Slot Conflict
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              This time slot conflicts with existing appointments:
            </Typography>
            <List>
              {conflictDialog.conflicts.map((conflict, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemText
                    primary={`${formatTime(conflict.appointmentStart || conflict.reservationStart)} - ${formatTime(conflict.appointmentEnd || conflict.reservationEnd)}`}
                    secondary={`${conflict.patientFirstName} ${conflict.patientLastName} • ${conflict.appointmentType}`}
                  />
                </ListItem>
              ))}
            </List>
            <Typography variant="body2" color="text.secondary">
              Please select a different time slot.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConflictDialog({ open: false, conflicts: [] })} color="primary">
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default CreateAppointmentPage;

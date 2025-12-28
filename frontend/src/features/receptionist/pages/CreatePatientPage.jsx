import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
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
  Paper,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import receptionistPatientService from '../services/receptionistPatientService';

const CreatePatientPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'validation']);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    age: '',
    sex: '',
    birthDate: null,
    streetAddress: '',
    cityName: '',
    stateName: '',
    zipCode: '',
    countryName: '',
    bio: '',
    location: '',
    profilePictureUrl: ''
  });

  const steps = [
    t('receptionist.createPatient.steps.personalInfo'),
    t('receptionist.createPatient.steps.contactDetails'),
    t('receptionist.createPatient.steps.addressInformation')
  ];

  const handleBack = () => {
    navigate('/receptionist/patients');
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      birthDate: date
    });
    
    if (date) {
      const today = new Date();
      const birthDate = new Date(date);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setFormData(prev => ({
        ...prev,
        age: age.toString()
      }));
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return formData.firstName && formData.lastName && formData.email && 
               formData.password && formData.username && formData.sex && formData.birthDate;
      case 1:
        return formData.phoneNumber;
      case 2:
        return formData.cityName && formData.stateName && formData.countryName;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
      setError('');
    } else {
      setError(t('receptionist.createPatient.errors.fillRequiredFields'));
    }
  };

  const handlePrevious = () => {
    setActiveStep((prev) => prev - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(2)) {
      setError(t('receptionist.createPatient.errors.fillRequiredFields'));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submitData = {
        ...formData,
        birthDate: formData.birthDate ? formData.birthDate.toISOString().split('T')[0] : '',
        age: parseInt(formData.age) || 0
      };

      const response = await receptionistPatientService.createPatient(submitData);
      
      setSuccess(t('receptionist.createPatient.success.created'));
      
      setTimeout(() => {
        navigate(`/receptionist/patients/${response.patient.patientId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error creating patient:', error);
      setError(error.response?.data?.error || t('receptionist.createPatient.errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label={t('receptionist.createPatient.fields.username')}
                value={formData.username}
                onChange={handleInputChange('username')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label={t('receptionist.createPatient.fields.email')}
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label={t('receptionist.createPatient.fields.firstName')}
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label={t('receptionist.createPatient.fields.lastName')}
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label={t('receptionist.createPatient.fields.password')}
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                helperText={t('validation:password.minLength', { min: 6 })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl required fullWidth>
                <InputLabel>{t('patient.fields.gender')}</InputLabel>
                <Select
                  value={formData.sex}
                  label={t('patient.fields.gender')}
                  onChange={handleInputChange('sex')}
                >
                  <MenuItem value="Male">{t('patient.gender.male')}</MenuItem>
                  <MenuItem value="Female">{t('patient.gender.female')}</MenuItem>
                  <MenuItem value="Other">{t('patient.gender.other')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label={t('receptionist.createPatient.fields.birthDate')}
                  value={formData.birthDate}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                  maxDate={new Date()}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('patient.fields.age')}
                type="number"
                value={formData.age}
                onChange={handleInputChange('age')}
                disabled
                helperText={t('receptionist.createPatient.fields.ageHelper')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('receptionist.createPatient.fields.bio')}
                multiline
                rows={3}
                value={formData.bio}
                onChange={handleInputChange('bio')}
                placeholder={t('receptionist.createPatient.fields.bioPlaceholder')}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label={t('receptionist.createPatient.fields.phoneNumber')}
                value={formData.phoneNumber}
                onChange={handleInputChange('phoneNumber')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('receptionist.createPatient.fields.profilePictureUrl')}
                value={formData.profilePictureUrl}
                onChange={handleInputChange('profilePictureUrl')}
                placeholder={t('receptionist.createPatient.fields.profilePictureUrlPlaceholder')}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('receptionist.createPatient.fields.streetAddress')}
                value={formData.streetAddress}
                onChange={handleInputChange('streetAddress')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label={t('receptionist.createPatient.fields.city')}
                value={formData.cityName}
                onChange={handleInputChange('cityName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label={t('receptionist.createPatient.fields.state')}
                value={formData.stateName}
                onChange={handleInputChange('stateName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('receptionist.createPatient.fields.zipCode')}
                value={formData.zipCode}
                onChange={handleInputChange('zipCode')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label={t('receptionist.createPatient.fields.country')}
                value={formData.countryName}
                onChange={handleInputChange('countryName')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('receptionist.createPatient.fields.location')}
                value={formData.location}
                onChange={handleInputChange('location')}
                placeholder={t('receptionist.createPatient.fields.locationPlaceholder')}
              />
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {t('receptionist.createPatient.title')}
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          {t('receptionist.createPatient.subtitle')}
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

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form onSubmit={activeStep === steps.length - 1 ? handleSubmit : undefined}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">
                  {steps[activeStep]}
                </Typography>
              </Box>

              {renderStepContent(activeStep)}

              <Box display="flex" justifyContent="space-between" mt={4}>
                <Button
                  onClick={handlePrevious}
                  disabled={activeStep === 0}
                >
                  {t('buttons.back')}
                </Button>
                
                <Box>
                  {activeStep < steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!validateStep(activeStep)}
                    >
                      {t('buttons.next')}
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading || !validateStep(activeStep)}
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                      {loading ? t('receptionist.createPatient.actions.creating') : t('receptionist.createPatient.actions.create')}
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </form>
      </Paper>
    </Container>
  );
};

export default CreatePatientPage;

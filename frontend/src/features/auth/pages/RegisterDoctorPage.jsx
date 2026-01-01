import React, {useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Card,
  useTheme,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Autocomplete,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  PhotoCamera as PhotoCameraIcon,
  Visibility,
  VisibilityOff,
  CheckCircle,
  ArrowForward,
  ArrowBack,
  LocalHospital as HospitalIcon,
  School as SchoolIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import authService from '../services/authService';

const RegisterContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
}));

const RegisterPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  width: '100%',
  maxWidth: 900,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1),
    '&:hover fieldset': {
      borderColor: '#667eea',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#667eea',
    },
  },
  '& .MuiFormHelperText-root': {
    fontSize: '0.75rem',
  },
}));

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 4),
  fontSize: '1.1rem',
  fontWeight: 'bold',
  textTransform: 'none',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
  },
  '&:disabled': {
    background: '#ccc',
    transform: 'none',
  },
}));

const FileUploadBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.grey[300]}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    borderColor: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
  },
}));

const SuccessCard = styled(Card)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(4),
  background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
  color: 'white',
  borderRadius: theme.spacing(2),
}));

const LocationCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.grey[300]}`,
  borderRadius: theme.spacing(1),
  marginTop: theme.spacing(2),
}));

const medicalSpecialties = [
  'General Practice', 'Internal Medicine', 'Pediatrics', 'Cardiology', 'Dermatology',
  'Endocrinology', 'Gastroenterology', 'Hematology', 'Infectious Disease', 'Nephrology',
  'Neurology', 'Oncology', 'Ophthalmology', 'Orthopedics', 'Otolaryngology',
  'Pathology', 'Psychiatry', 'Pulmonology', 'Radiology', 'Rheumatology',
  'Surgery', 'Urology', 'Emergency Medicine', 'Family Medicine', 'Anesthesiology',
  'Obstetrics and Gynecology', 'Physical Medicine', 'Plastic Surgery', 'Sports Medicine'
];

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*?[0-9])(?=.*[!@#$%]).{8,24}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[0-9]{10}$/;

const RegisterDoctorPage = () => {
  const { t } = useTranslation(['auth', 'common', 'validation']);
  const theme = useTheme();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    clinicPhone: '',
    showClinicPhone: true,
    birthdate: '',
    sex: '',
    licenseNumber: '',
    specialty: '',
    experience: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    latitude: '',
    longitude: '',
    bio: '',
  });

  const [validation, setValidation] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
    phone: false,
    clinicPhone: false,
  });

  const [focus, setFocus] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const steps = [
    t('doctorRegistration.steps.accountDetails'),
    t('doctorRegistration.steps.personalInformation'),
    t('doctorRegistration.steps.professionalDetails'),
    t('doctorRegistration.steps.locationAndBio')
  ];

  useEffect(() => {
    setValidation(prev => ({
      ...prev,
      username: USER_REGEX.test(formData.username)
    }));
  }, [formData.username]);

  useEffect(() => {
    setValidation(prev => ({
      ...prev,
      email: EMAIL_REGEX.test(formData.email)
    }));
  }, [formData.email]);

  useEffect(() => {
    setValidation(prev => ({
      ...prev,
      password: PWD_REGEX.test(formData.password),
      confirmPassword: formData.password === formData.confirmPassword && formData.password !== ''
    }));
  }, [formData.password, formData.confirmPassword]);

  useEffect(() => {
    setValidation(prev => ({
      ...prev,
      phone: PHONE_REGEX.test(formData.phone)
    }));
  }, [formData.phone]);

  useEffect(() => {
    setValidation(prev => ({
      ...prev,
      clinicPhone: PHONE_REGEX.test(formData.clinicPhone)
    }));
  }, [formData.clinicPhone]);

  useEffect(() => {
    setError('');
  }, [formData]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleAutocompleteChange = (field) => (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      [field]: newValue || ''
    }));
  };

  const handleFocus = (field) => () => {
    setFocus(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => () => {
    setFocus(prev => ({ ...prev, [field]: false }));
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleGetCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError(t('auth:doctorRegistration.locationError'));
          setLocationLoading(false);
        }
      );
    } else {
      setError(t('auth:doctorRegistration.geolocationNotSupported'));
      setLocationLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!validation.username || !validation.email || !validation.password || !validation.confirmPassword) {
        setError(t('auth:doctorRegistration.correctValidationErrors'));
        return;
      }
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const requiredFields = ['username', 'firstName', 'lastName', 'email', 'password', 'phone', 'clinicPhone', 'birthdate', 'licenseNumber', 'specialty', 'experience'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setError(t('auth:doctorRegistration.fillRequiredFields'));
      setLoading(false);
      return;
    }

    if (!validation.username || !validation.email || !validation.password || !validation.confirmPassword || !validation.phone || !validation.clinicPhone) {
      setError(t('auth:doctorRegistration.correctValidationErrors'));
      setLoading(false);
      return;
    }

    const submitData = new FormData();
    if (file) submitData.append('file', file);
    submitData.append('Username', formData.username);
    submitData.append('Password', formData.password);
    submitData.append('Email', formData.email);
    submitData.append('PhoneNumber', formData.phone);
    submitData.append('ClinicPhoneNumber', formData.clinicPhone);
    submitData.append('ShowClinicPhone', String(!!formData.showClinicPhone));
    submitData.append('FirstName', formData.firstName);
    submitData.append('LastName', formData.lastName);
    submitData.append('BirthDate', formData.birthdate);
    submitData.append('MedicalLicense', formData.licenseNumber);
    submitData.append('SpecialtyCode', formData.specialty);
    submitData.append('Experience', formData.experience);
    submitData.append('StreetAddress', formData.address);
    submitData.append('CityName', formData.city);
    submitData.append('StateName', formData.state);
    submitData.append('ZipCode', formData.zipCode);
    submitData.append('CountryName', formData.country);
    submitData.append('Latitude', formData.latitude);
    submitData.append('Longitude', formData.longitude);
    submitData.append('Bio', formData.bio);
    submitData.append('Sex', formData.sex);

    try {
      const response = await authService.registerDoctor(submitData);

      if (response.success) {
        setSuccess(true);
      } else {
        setError(t('auth:doctorRegistration.registrationFailed'));
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(t('auth:errors.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            {/* Profile Picture */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {t('auth:doctorRegistration.profilePicture')}
              </Typography>
              <FileUploadBox onClick={() => document.getElementById('file-upload').click()}>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {filePreview ? (
                  <Box>
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      style={{ 
                        width: 100, 
                        height: 100, 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        marginBottom: 8
                      }} 
                    />
                    <Typography variant="body2">{t('doctorRegistration.clickToChange')}</Typography>
                  </Box>
                ) : (
                  <Box>
                    <PhotoCameraIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('doctorRegistration.clickToUpload')}
                    </Typography>
                  </Box>
                )}
              </FileUploadBox>
            </Grid>

            {/* Gender */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">{t('doctorRegistration.gender')}</FormLabel>
                <RadioGroup
                  row
                  value={formData.sex}
                  onChange={handleInputChange('sex')}
                >
                  <FormControlLabel value="Male" control={<Radio />} label={t('doctorRegistration.male')} />
                  <FormControlLabel value="Female" control={<Radio />} label={t('doctorRegistration.female')} />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Username */}
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                label={t('doctorRegistration.username')}
                value={formData.username}
                onChange={handleInputChange('username')}
                onFocus={handleFocus('username')}
                onBlur={handleBlur('username')}
                error={focus.username && formData.username && !validation.username}
                helperText={
                  focus.username && formData.username && !validation.username
                    ? t('doctorRegistration.fillRequiredFields')
                    : ''
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: validation.username && (
                    <InputAdornment position="end">
                      <CheckCircle sx={{ color: 'success.main' }} />
                    </InputAdornment>
                  ),
                }}
                required
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                type="email"
                label={t('auth:login.emailLabel')}
                value={formData.email}
                onChange={handleInputChange('email')}
                onFocus={handleFocus('email')}
                onBlur={handleBlur('email')}
                error={focus.email && formData.email && !validation.email}
                helperText={
                  focus.email && formData.email && !validation.email
                    ? t('validation.email.invalid')
                    : ''
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: validation.email && (
                    <InputAdornment position="end">
                      <CheckCircle sx={{ color: 'success.main' }} />
                    </InputAdornment>
                  ),
                }}
                required
              />
            </Grid>

            {/* Password */}
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label={t('auth:doctorRegistration.personalInfo.password', { defaultValue: t('auth:login.passwordLabel') })}
                value={formData.password}
                onChange={handleInputChange('password')}
                onFocus={handleFocus('password')}
                onBlur={handleBlur('password')}
                error={focus.password && formData.password && !validation.password}
                helperText={
                  focus.password && formData.password && !validation.password
                    ? t('validation:password.pattern')
                    : ''
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                required
              />
            </Grid>

            {/* Confirm Password */}
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                type={showConfirmPassword ? 'text' : 'password'}
                label={t('auth:doctorRegistration.personalInfo.confirmPassword', { defaultValue: t('auth:login.confirmPasswordLabel') })}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                onFocus={handleFocus('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                error={focus.confirmPassword && formData.confirmPassword && !validation.confirmPassword}
                helperText={
                  focus.confirmPassword && formData.confirmPassword && !validation.confirmPassword
                    ? t('validation:password.noMatch')
                    : ''
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                required
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            {/* First Name */}
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label={t('auth:doctorRegistration.firstName')}
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
                required
              />
            </Grid>

            {/* Last Name */}
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label={t('auth:doctorRegistration.lastName')}
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
                required
              />
            </Grid>

            {/* Birth Date */}
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                type="date"
                label={t('auth:doctorRegistration.birthDate')}
                value={formData.birthdate}
                onChange={handleInputChange('birthdate')}
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
            </Grid>

            {/* Personal Phone */}
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label={t('auth:doctorRegistration.phoneNumber')}
                value={formData.phone}
                onChange={handleInputChange('phone')}
                onFocus={handleFocus('phone')}
                onBlur={handleBlur('phone')}
                error={focus.phone && formData.phone && !validation.phone}
                helperText={
                  focus.phone && formData.phone && !validation.phone
                    ? t('validation:phone.invalid')
                    : ''
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: validation.phone && (
                    <InputAdornment position="end">
                      <CheckCircle sx={{ color: 'success.main' }} />
                    </InputAdornment>
                  ),
                }}
                required
              />
            </Grid>

            {/* Clinic Phone */}
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label={t('auth:doctorRegistration.clinicPhoneNumber')}
                value={formData.clinicPhone}
                onChange={handleInputChange('clinicPhone')}
                onFocus={handleFocus('clinicPhone')}
                onBlur={handleBlur('clinicPhone')}
                error={focus.clinicPhone && formData.clinicPhone && !validation.clinicPhone}
                helperText={
                  focus.clinicPhone && formData.clinicPhone && !validation.clinicPhone
                    ? t('validation:phone.invalid')
                    : ''
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: validation.clinicPhone && (
                    <InputAdornment position="end">
                      <CheckCircle sx={{ color: 'success.main' }} />
                    </InputAdornment>
                  ),
                }}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!formData.showClinicPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, showClinicPhone: e.target.checked }))}
                  />
                }
                label={t('auth:doctorRegistration.showClinicPhone')}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            {/* Medical License */}
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label={t('auth:doctorRegistration.medicalLicense')}
                value={formData.licenseNumber}
                onChange={handleInputChange('licenseNumber')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <HospitalIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
                required
              />
            </Grid>

            {/* Specialty */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                value={formData.specialty}
                onChange={handleAutocompleteChange('specialty')}
                options={medicalSpecialties}
                renderInput={(params) => (
                  <StyledTextField
                    {...params}
                    label={t('auth:doctorRegistration.medicalSpecialty')}
                    required
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SchoolIcon sx={{ color: '#667eea' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                freeSolo
              />
            </Grid>

            {/* Experience */}
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                label={t('auth:doctorRegistration.yearsOfExperience')}
                type="number"
                value={formData.experience}
                onChange={handleInputChange('experience')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
                inputProps={{ min: 0, max: 50 }}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            {/* Address */}
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                label={t('auth:doctorRegistration.clinicAddress')}
                value={formData.address}
                onChange={handleInputChange('address')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <HomeIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* City */}
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label={t('auth:doctorRegistration.city')}
                value={formData.city}
                onChange={handleInputChange('city')}
              />
            </Grid>

            {/* State */}
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label={t('auth:doctorRegistration.state')}
                value={formData.state}
                onChange={handleInputChange('state')}
              />
            </Grid>

            {/* ZIP Code */}
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label={t('auth:doctorRegistration.zipCode')}
                value={formData.zipCode}
                onChange={handleInputChange('zipCode')}
              />
            </Grid>

            {/* Country */}
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label={t('auth:doctorRegistration.country')}
                value={formData.country}
                onChange={handleInputChange('country')}
              />
            </Grid>

            {/* Location Coordinates */}
            <Grid item xs={12}>
              <LocationCard>
                <Typography variant="h6" gutterBottom>
                  <LocationIcon sx={{ mr: 1 }} />
                  {t('auth:doctorRegistration.locationCoordinates')}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('auth:doctorRegistration.locationDescription')}
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={5}>
                    <StyledTextField
                      fullWidth
                      label={t('auth:doctorRegistration.latitude')}
                      value={formData.latitude}
                      onChange={handleInputChange('latitude')}
                      placeholder="e.g., 37.4221"
                      type="number"
                      inputProps={{ step: 'any' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <StyledTextField
                      fullWidth
                      label={t('auth:doctorRegistration.longitude')}
                      value={formData.longitude}
                      onChange={handleInputChange('longitude')}
                      placeholder="e.g., -122.0841"
                      type="number"
                      inputProps={{ step: 'any' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleGetCurrentLocation}
                      disabled={locationLoading}
                      startIcon={locationLoading ? <CircularProgress size={16} /> : <MyLocationIcon />}
                      sx={{ height: '56px' }}
                    >
                      {locationLoading ? t('auth:doctorRegistration.gettingLocation') : t('auth:doctorRegistration.useCurrentLocation')}
                    </Button>
                  </Grid>
                </Grid>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {t('auth:doctorRegistration.coordinatesHelp')}
                </Typography>
              </LocationCard>
            </Grid>

            {/* Bio */}
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                multiline
                rows={4}
                label={t('auth:doctorRegistration.professionalBio')}
                value={formData.bio}
                onChange={handleInputChange('bio')}
                placeholder={t('auth:doctorRegistration.bioPlaceholder')}
                helperText={t('auth:doctorRegistration.bioHelperText')}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <RegisterContainer>
          <SuccessCard>
            <CheckCircle sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              {t('auth:doctorRegistration.registrationSuccessful')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              {t('auth:doctorRegistration.successMessage')}
            </Typography>
            <ModernButton
              variant="contained"
              component={Link}
              to="/login"
              sx={{ bgcolor: 'white', color: '#4caf50' }}
              endIcon={<ArrowForward />}
            >
              {t('auth:doctorRegistration.signInNow')}
            </ModernButton>
          </SuccessCard>
      </RegisterContainer>
    );
  }

  return (
    <RegisterContainer>
        <RegisterPaper elevation={10}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
              {t('auth:doctorRegistration.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('auth:doctorRegistration.subtitle')}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <div>
            {getStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBack />}
                sx={{ mr: 1 }}
              >
                {t('common:buttons.back')}
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              {activeStep === steps.length - 1 ? (
                <ModernButton
                  onClick={handleSubmit}
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                >
                  {loading ? t('auth:doctorRegistration.registering') : t('auth:doctorRegistration.completeRegistration')}
                </ModernButton>
              ) : (
                <ModernButton
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                >
                  {t('common:buttons.next')}
                </ModernButton>
              )}
            </Box>
          </div>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('auth:register.alreadyHaveAccount')}{' '}
              <Button
                component={Link}
                to="/login"
                variant="text"
                sx={{
                  color: '#667eea',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
                }}
              >
                {t('common:buttons.signIn')}
              </Button>
            </Typography>
          </Box>
        </RegisterPaper>
    </RegisterContainer>
  );
};

export default RegisterDoctorPage;

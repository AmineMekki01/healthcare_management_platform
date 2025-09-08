import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Card,
  useTheme,
  useMediaQuery,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Divider,
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
  Info as InfoIcon,
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
  maxWidth: 800,
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
  '&.dragover': {
    borderColor: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
}));

const SuccessCard = styled(Card)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(4),
  background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
  color: 'white',
  borderRadius: theme.spacing(2),
}));

const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*?[0-9])(?=.*[!@#$%]).{8,24}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[0-9]{10}$/;

const RegisterPatientPage = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const userRef = useRef();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    birthdate: '',
    sex: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    bio: '',
  });

  const [validation, setValidation] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
    phone: false,
  });

  const [focus, setFocus] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const steps = ['Account Details', 'Personal Information', 'Address & Bio'];

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
    setError('');
    setHasSubmitted(false);
  }, [formData]);

  useEffect(() => {
    setActiveStep(0);
    setHasSubmitted(false);
    setIsSubmitting(false);
    setLoading(false);
    setSuccess(false);
    setError('');
  }, []);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter' && activeStep !== steps.length - 1) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
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

  const handleNext = () => {
    
    if (activeStep === 0) {
      if (!validation.username || !validation.email || !validation.password || !validation.confirmPassword) {
        setError('Please fill in all required fields correctly.');
        return;
      }
    } else if (activeStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.phone || !validation.phone) {
        setError('Please fill in all required fields correctly.');
        return;
      }
    }
    
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
      setError('');
      setHasSubmitted(false);
      setIsSubmitting(false);
    } else {
      console.log('Already at last step, not incrementing. Current step:', activeStep, 'Last step index:', steps.length - 1);
    }
  };

  const isStepValid = (step) => {
    switch (step) {
      case 0:
        return validation.username && validation.email && validation.password && validation.confirmPassword;
      case 1:
        return formData.firstName && formData.lastName && formData.phone && validation.phone;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError('');
    setHasSubmitted(false);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading || hasSubmitted || isSubmitting) {
      return;
    }
    
    if (activeStep !== 2) {
      return;
    }
    
    if (activeStep !== steps.length - 1) {
      return;
    }
    
    if (steps[activeStep] !== 'Address & Bio') {
      return;
    }
    
    setHasSubmitted(true);
    setIsSubmitting(true);
    setLoading(true);
    setError('');


    if (!validation.username || !validation.email || !validation.password || !validation.confirmPassword || 
        !formData.firstName || !formData.lastName || !formData.phone || !validation.phone) {
      const missingFields = [];
      if (!validation.username) missingFields.push('username');
      if (!validation.email) missingFields.push('email');
      if (!validation.password) missingFields.push('password');
      if (!validation.confirmPassword) missingFields.push('confirm password');
      if (!formData.firstName) missingFields.push('first name');
      if (!formData.lastName) missingFields.push('last name');
      if (!formData.phone) missingFields.push('phone number');
      if (!validation.phone) missingFields.push('valid phone number');
      
      setError(`Please fill in all required fields correctly. Missing: ${missingFields.join(', ')}`);
      setLoading(false);
      return;
    }

    const submitData = new FormData();
    if (file) submitData.append('file', file);
    submitData.append('Username', formData.username);
    submitData.append('Password', formData.password);
    submitData.append('Email', formData.email);
    submitData.append('PhoneNumber', formData.phone);
    submitData.append('FirstName', formData.firstName);
    submitData.append('LastName', formData.lastName);
    submitData.append('BirthDate', formData.birthdate);
    submitData.append('StreetAddress', formData.address);
    submitData.append('CityName', formData.city);
    submitData.append('StateName', formData.state);
    submitData.append('ZipCode', formData.zipCode);
    submitData.append('CountryName', formData.country);
    submitData.append('PatientBio', formData.bio);
    submitData.append('Sex', formData.sex);

    try {
      const response = await authService.registerPatient(submitData);

      if (response.success === 'true' || response.success === true) {
        setSuccess(true);
      } else {
        setError(response.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.status === 400) {
        setError('Invalid data provided. Please check all fields and try again.');
      } else if (error.response?.status === 409) {
        setError('An account with this email or username already exists.');
      } else {
        setError('An error occurred during registration. Please try again.');
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Profile Picture (Optional)
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
                    <Typography variant="body2">Click to change photo</Typography>
                  </Box>
                ) : (
                  <Box>
                    <PhotoCameraIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Click to upload profile picture
                    </Typography>
                  </Box>
                )}
              </FileUploadBox>
            </Grid>

            {/* Gender */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Gender</FormLabel>
                <RadioGroup
                  row
                  value={formData.sex}
                  onChange={handleInputChange('sex')}
                >
                  <FormControlLabel value="Male" control={<Radio />} label="Male" />
                  <FormControlLabel value="Female" control={<Radio />} label="Female" />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Username */}
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={handleInputChange('username')}
                onKeyDown={handleInputKeyDown}
                onFocus={handleFocus('username')}
                onBlur={handleBlur('username')}
                error={!!(focus.username && formData.username && !validation.username)}
                helperText={
                  focus.username && formData.username && !validation.username
                    ? 'Username must be 4-24 characters long and start with a letter'
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
                label="Email Address"
                value={formData.email}
                onChange={handleInputChange('email')}
                onKeyDown={handleInputKeyDown}
                onFocus={handleFocus('email')}
                onBlur={handleBlur('email')}
                error={!!(focus.email && formData.email && !validation.email)}
                helperText={
                  focus.email && formData.email && !validation.email
                    ? 'Please enter a valid email address'
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
                label="Password"
                value={formData.password}
                onChange={handleInputChange('password')}
                onKeyDown={handleInputKeyDown}
                onFocus={handleFocus('password')}
                onBlur={handleBlur('password')}
                error={!!(focus.password && formData.password && !validation.password)}
                helperText={
                  focus.password && formData.password && !validation.password
                    ? 'Password must be 8-24 characters with uppercase, lowercase, number, and special character'
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
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                onKeyDown={handleInputKeyDown}
                onFocus={handleFocus('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                error={!!(focus.confirmPassword && formData.confirmPassword && !validation.confirmPassword)}
                helperText={
                  focus.confirmPassword && formData.confirmPassword && !validation.confirmPassword
                    ? 'Passwords must match'
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
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                onKeyDown={handleInputKeyDown}
                onFocus={handleFocus('firstName')}
                onBlur={handleBlur('firstName')}
                error={!!(focus.firstName === false && !formData.firstName)}
                helperText={focus.firstName === false && !formData.firstName ? 'First name is required' : ''}
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
                label="Last Name"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                onKeyDown={handleInputKeyDown}
                onFocus={handleFocus('lastName')}
                onBlur={handleBlur('lastName')}
                error={!!(focus.lastName === false && !formData.lastName)}
                helperText={focus.lastName === false && !formData.lastName ? 'Last name is required' : ''}
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
                label="Birth Date"
                value={formData.birthdate}
                onChange={handleInputChange('birthdate')}
                onKeyDown={handleInputKeyDown}
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
            </Grid>

            {/* Phone */}
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                onKeyDown={handleInputKeyDown}
                onFocus={handleFocus('phone')}
                onBlur={handleBlur('phone')}
                error={!!(focus.phone && formData.phone && !validation.phone)}
                helperText={
                  focus.phone && formData.phone && !validation.phone
                    ? 'Please enter a valid 10-digit phone number'
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
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            {/* Address */}
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                label="Street Address"
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
                label="City"
                value={formData.city}
                onChange={handleInputChange('city')}
              />
            </Grid>

            {/* State */}
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={handleInputChange('state')}
              />
            </Grid>

            {/* ZIP Code */}
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label="ZIP Code"
                value={formData.zipCode}
                onChange={handleInputChange('zipCode')}
              />
            </Grid>

            {/* Country */}
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={handleInputChange('country')}
              />
            </Grid>

            {/* Bio */}
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                multiline
                rows={4}
                label="Tell us about yourself"
                value={formData.bio}
                onChange={handleInputChange('bio')}
                placeholder="Optional: Share a brief bio about yourself..."
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
                Registration Successful! 🎉
                </Typography>
                <Typography variant="body1" sx={{ mb: 4 }}>
                Your patient account has been created successfully. You can now sign in and start using our platform.
                </Typography>
                <ModernButton
                variant="contained"
                component={Link}
                to="/login"
                sx={{ bgcolor: 'white', color: '#4caf50' }}
                endIcon={<ArrowForward />}
                >
                Sign In Now
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
                Create Patient Account 🏥
            </Typography>
            <Typography variant="body1" color="text.secondary">
                Join our healthcare platform to book appointments and manage your health records
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
                  type="button"
                >
                  Back
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />
                {activeStep === steps.length - 1 ? (
                  <ModernButton
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || hasSubmitted}
                    endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                    type="button"
                  >
                    {loading ? 'Registering...' : 'Complete Registration'}
                  </ModernButton>
                ) : (
                  <ModernButton
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isStepValid(activeStep) || hasSubmitted}
                    endIcon={<ArrowForward />}
                    type="button"
                  >
                    Next
                  </ModernButton>
                )}
              </Box>
            </div>
            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
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
                Sign In
                </Button>
            </Typography>
            </Box>
        </RegisterPaper>
    </RegisterContainer>
  );
};

export default RegisterPatientPage;

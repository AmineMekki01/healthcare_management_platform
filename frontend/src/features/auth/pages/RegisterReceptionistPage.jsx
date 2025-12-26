import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  Paper,
  FormControlLabel,
  Card,
  CardContent,
  RadioGroup,
  Radio,
  FormLabel,
  CircularProgress,
  Divider,
  useTheme,
  InputAdornment,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ArrowBack,
  CheckCircle,
  ArrowForward,
  Visibility,
  VisibilityOff,
  Email,
  Phone,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
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

const SuccessCard = styled(Card)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(4),
  background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
  color: 'white',
  borderRadius: theme.spacing(2),
}));

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*?[0-9])(?=.*[!@#$%]).{8,24}$/;
const PHONE_REGEX = /^[0-9]{10}$/;

const RegisterReceptionistPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    sex: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    employeeId: '',
    department: '',
    startDate: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  });

  const [validation, setValidation] = useState({
    email: false,
    password: false,
    confirmPassword: false,
    phone: false,
  });

  const [focus, setFocus] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { setIsLoggedIn, setUserType, setUserId, setReceptionistId, setUserFullName } = useContext(AuthContext);

  const steps = [
    t('receptionistRegistration.steps.personalInfo'),
    t('receptionistRegistration.steps.workDetails'),
    t('receptionistRegistration.steps.review')
  ];

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
      phone: PHONE_REGEX.test(formData.phoneNumber)
    }));
  }, [formData.phoneNumber]);

  useEffect(() => {
    setError('');
  }, [formData]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFocus = (field) => () => {
    setFocus(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => () => {
    setFocus(prev => ({ ...prev, [field]: false }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return formData.firstName && formData.lastName && formData.email && formData.phoneNumber && formData.password && formData.confirmPassword && validation.email && validation.password && validation.confirmPassword;
      case 1:
        return formData.employeeId && formData.startDate;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep < steps.length - 1) {
        setActiveStep(activeStep + 1);
      } else {
        handleSubmit();
      }
    } else {
      setError('Please fill in all required fields correctly for this step.');
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!validation.email || !validation.password || !validation.confirmPassword || !validation.phone) {
        setError('Please fill in all required fields correctly.');
        setLoading(false);
        return;
      }

      const registrationData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        sex: formData.sex,
        phone_number: formData.phoneNumber,
        password: formData.password,
        birth_date: formData.dateOfBirth,
        street_address: formData.address,
        city_name: formData.city,
        state_name: formData.state,
        zip_code: formData.zipCode,
        country_name: formData.country,
        bio: formData.bio || '',
        username: formData.email.split('@')[0],
        employee_id: formData.employeeId,
        department: formData.department,
        start_date: formData.startDate,
        emergency_contact: formData.emergencyContact,
        userType: 'receptionist'
      };

      const response = await authService.registerReceptionist(registrationData);

      if (response.success) {
        localStorage.setItem('userType', 'receptionist');
        localStorage.setItem('receptionistId', response.receptionistId);
        localStorage.setItem('userFullName', `${formData.firstName} ${formData.lastName}`);
        localStorage.setItem('userProfilePictureUrl', response.profilePhotoUrl || '');

        setIsLoggedIn(true);
        setUserType('receptionist');
        setUserId(response.receptionistId);
        setReceptionistId(response.receptionistId);
        setUserFullName(`${formData.firstName} ${formData.lastName}`);

        setSuccess(true);
        setTimeout(() => {
          navigate('/receptionist-dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333', mb: 3 }}>
              Personal Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  onFocus={handleFocus('firstName')}
                  onBlur={handleBlur('firstName')}
                  required
                  error={!!(focus.firstName === false && !formData.firstName)}
                  helperText={focus.firstName === false && !formData.firstName ? 'First name is required' : ''}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  onFocus={handleFocus('lastName')}
                  onBlur={handleBlur('lastName')}
                  required
                  error={!!(focus.lastName === false && !formData.lastName)}
                  helperText={focus.lastName === false && !formData.lastName ? 'Last name is required' : ''}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  onFocus={handleFocus('email')}
                  onBlur={handleBlur('email')}
                  required
                  error={!!(focus.email === false && (!formData.email || !validation.email))}
                  helperText={
                    focus.email === false && !formData.email 
                      ? 'Email is required' 
                      : focus.email === false && formData.email && !validation.email 
                      ? 'Please enter a valid email address' 
                      : ''
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Email color={validation.email ? 'success' : 'disabled'} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleInputChange('phoneNumber')}
                  onFocus={handleFocus('phoneNumber')}
                  onBlur={handleBlur('phoneNumber')}
                  required
                  error={!!(focus.phoneNumber === false && (!formData.phoneNumber || !validation.phone))}
                  helperText={
                    focus.phoneNumber === false && !formData.phoneNumber 
                      ? 'Phone number is required' 
                      : focus.phoneNumber === false && formData.phoneNumber && !validation.phone 
                      ? 'Please enter a valid 10-digit phone number' 
                      : ''
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Phone color={validation.phone ? 'success' : 'disabled'} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  onFocus={handleFocus('password')}
                  onBlur={handleBlur('password')}
                  required
                  error={!!(focus.password === false && (!formData.password || !validation.password))}
                  helperText={
                    focus.password === false && !formData.password 
                      ? 'Password is required' 
                      : focus.password === false && formData.password && !validation.password 
                      ? 'Password must be 8-24 characters with uppercase, lowercase, number, and special character' 
                      : ''
                  }
                  InputProps={{
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
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  onFocus={handleFocus('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  required
                  error={!!(focus.confirmPassword === false && (!formData.confirmPassword || !validation.confirmPassword))}
                  helperText={
                    focus.confirmPassword === false && !formData.confirmPassword 
                      ? 'Please confirm your password' 
                      : focus.confirmPassword === false && formData.confirmPassword && !validation.confirmPassword 
                      ? 'Passwords do not match' 
                      : ''
                  }
                  InputProps={{
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
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ color: '#333', fontWeight: 'bold' }}>Gender</FormLabel>
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
              
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange('dateOfBirth')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  label="Address"
                  value={formData.address}
                  onChange={handleInputChange('address')}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <StyledTextField
                  fullWidth
                  label="City"
                  value={formData.city}
                  onChange={handleInputChange('city')}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <StyledTextField
                  fullWidth
                  label="State"
                  value={formData.state}
                  onChange={handleInputChange('state')}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <StyledTextField
                  fullWidth
                  label="ZIP Code"
                  value={formData.zipCode}
                  onChange={handleInputChange('zipCode')}
                />
              </Grid>
              
              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  label="Country"
                  value={formData.country}
                  onChange={handleInputChange('country')}
                />
              </Grid>
            </Grid>
          </Box>
        );
        
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333', mb: 3 }}>
              Work Details
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <AlertTitle>Doctor Assignment</AlertTitle>
              After registration, you'll be able to work once a doctor assigns you to their practice.
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Employee ID"
                  value={formData.employeeId}
                  onChange={handleInputChange('employeeId')}
                  required
                  error={!!(focus.employeeId === false && !formData.employeeId)}
                  helperText={focus.employeeId === false && !formData.employeeId ? 'Employee ID is required' : ''}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Department"
                  value={formData.department}
                  onChange={handleInputChange('department')}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange('startDate')}
                  required
                  error={!!(focus.startDate === false && !formData.startDate)}
                  helperText={focus.startDate === false && !formData.startDate ? 'Start date is required' : ''}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            
            <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 'bold', color: '#333' }}>
              Emergency Contact
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <StyledTextField
                  fullWidth
                  label="Contact Name"
                  value={formData.emergencyContact.name}
                  onChange={handleInputChange('emergencyContact.name')}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <StyledTextField
                  fullWidth
                  label="Relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleInputChange('emergencyContact.relationship')}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <StyledTextField
                  fullWidth
                  label="Phone Number"
                  value={formData.emergencyContact.phone}
                  onChange={handleInputChange('emergencyContact.phone')}
                />
              </Grid>
            </Grid>
          </Box>
        );
        
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333', mb: 3 }}>
              Review Your Information
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <AlertTitle>Next Steps</AlertTitle>
              After registration, you'll receive access once a doctor assigns you to their practice and grants appropriate permissions.
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: '#667eea', fontWeight: 'bold' }}>
                      Personal Information
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Name:</strong> {formData.firstName} {formData.lastName}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Email:</strong> {formData.email}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Phone:</strong> {formData.phoneNumber}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Gender:</strong> {formData.sex || 'Not specified'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date of Birth:</strong> {formData.dateOfBirth || 'Not specified'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: '#667eea', fontWeight: 'bold' }}>
                      Work Information
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Employee ID:</strong> {formData.employeeId}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Department:</strong> {formData.department || 'Not specified'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Start Date:</strong> {formData.startDate}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {(formData.emergencyContact.name || formData.emergencyContact.phone) && (
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, color: '#667eea', fontWeight: 'bold' }}>
                        Emergency Contact
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Name:</strong> {formData.emergencyContact.name || 'Not specified'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Relationship:</strong> {formData.emergencyContact.relationship || 'Not specified'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Phone:</strong> {formData.emergencyContact.phone || 'Not specified'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
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
            Welcome to the Talent Pool! 🌟
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Your receptionist profile has been created successfully! You're now part of our talent pool where doctors can discover and hire qualified receptionists like you.
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
            {t('receptionistRegistration.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('receptionistRegistration.subtitle')}
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
              Back
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {activeStep === steps.length - 1 ? (
              <ModernButton
                onClick={handleSubmit}
                type="submit"
                variant="contained"
                disabled={loading || !validateStep(activeStep)}
                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
              >
                {loading ? 'Registering...' : 'Complete Registration'}
              </ModernButton>
            ) : (
              <ModernButton
                variant="contained"
                onClick={handleNext}
                disabled={!validateStep(activeStep)}
                endIcon={<ArrowForward />}
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

export default RegisterReceptionistPage;

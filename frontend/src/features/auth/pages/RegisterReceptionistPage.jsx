import React, { useState, useEffect } from 'react';
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
  PhotoCamera,
  Email,
  Phone,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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

const FileUploadBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.grey[300]}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    borderColor: '#667eea',
    backgroundColor: theme.palette.action.hover,
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
  const { t } = useTranslation(['auth', 'common', 'validation']);

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
    bio: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
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

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [experiences, setExperiences] = useState([]);

  const steps = [
    t('receptionistRegistration.steps.personalInfo'),
    t('receptionistRegistration.steps.experience'),
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

  const handleAddExperience = () => {
    setExperiences(prev => ([
      ...prev,
      {
        organizationName: '',
        positionTitle: '',
        location: '',
        startDate: '',
        endDate: '',
        description: '',
      }
    ]));
  };

  const handleRemoveExperience = (index) => {
    setExperiences(prev => prev.filter((_, i) => i !== index));
  };

  const handleExperienceChange = (index, field) => (event) => {
    const value = event.target.value;
    setExperiences(prev => prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp)));
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return formData.firstName && formData.lastName && formData.email && formData.phoneNumber && formData.password && formData.confirmPassword && formData.sex && formData.city && formData.state && formData.country && validation.email && validation.password && validation.confirmPassword && validation.phone;
      case 1:
        return experiences.every((exp) => {
          const isEmpty = !exp.organizationName && !exp.positionTitle && !exp.location && !exp.startDate && !exp.endDate && !exp.description;
          if (isEmpty) return true;
          return !!(exp.organizationName && exp.positionTitle && exp.startDate);
        });
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
      setError(t('auth:receptionistRegistration.correctValidationErrors'));
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

      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber || !formData.sex || !formData.city || !formData.state || !formData.country || !formData.password || !formData.confirmPassword) {
        setError(t('auth:receptionistRegistration.fillRequiredFields'));
        setLoading(false);
        return;
      }

      if (!validation.email || !validation.password || !validation.confirmPassword || !validation.phone) {
        setError(t('auth:receptionistRegistration.correctValidationErrors'));
        setLoading(false);
        return;
      }

      const submitData = new FormData();
      if (file) submitData.append('file', file);

      submitData.append('Username', formData.email.split('@')[0]);
      submitData.append('Password', formData.password);
      submitData.append('Email', formData.email);
      submitData.append('PhoneNumber', formData.phoneNumber);
      submitData.append('FirstName', formData.firstName);
      submitData.append('LastName', formData.lastName);
      submitData.append('BirthDate', formData.dateOfBirth);
      submitData.append('StreetAddress', formData.address);
      submitData.append('CityName', formData.city);
      submitData.append('StateName', formData.state);
      submitData.append('ZipCode', formData.zipCode);
      submitData.append('CountryName', formData.country);
      submitData.append('Sex', formData.sex);
      submitData.append('Bio', formData.bio || '');

      const cleanedExperiences = experiences
        .map((exp) => ({
          organizationName: exp.organizationName,
          positionTitle: exp.positionTitle,
          location: exp.location ? exp.location : null,
          startDate: exp.startDate,
          endDate: exp.endDate ? exp.endDate : null,
          description: exp.description ? exp.description : null,
        }))
        .filter((exp) => exp.organizationName || exp.positionTitle || exp.location || exp.startDate || exp.endDate || exp.description);

      if (cleanedExperiences.length > 0) {
        submitData.append('Experiences', JSON.stringify(cleanedExperiences));
      }

      const response = await authService.registerReceptionist(submitData);

      if (response.success === true || response.success === 'true') {
        setSuccess(true);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || t('auth:errors.registrationFailed'));
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
              {t('auth:receptionistRegistration.personalInfo.title')}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {t('auth:receptionistRegistration.profilePicture')}
                </Typography>
                <FileUploadBox onClick={() => document.getElementById('receptionist-file-upload').click()}>
                  <input
                    id="receptionist-file-upload"
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
                          marginBottom: 10
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {t('auth:receptionistRegistration.clickToChange')}
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <PhotoCamera sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {t('auth:receptionistRegistration.clickToUpload')}
                      </Typography>
                    </Box>
                  )}
                </FileUploadBox>
              </Grid>

              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label={t('auth:receptionistRegistration.personalInfo.firstName')}
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  onFocus={handleFocus('firstName')}
                  onBlur={handleBlur('firstName')}
                  required
                  error={!!(focus.firstName === false && !formData.firstName)}
                  helperText={focus.firstName === false && !formData.firstName ? t('validation:name.firstName') : ''}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label={t('auth:receptionistRegistration.personalInfo.lastName')}
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  onFocus={handleFocus('lastName')}
                  onBlur={handleBlur('lastName')}
                  required
                  error={!!(focus.lastName === false && !formData.lastName)}
                  helperText={focus.lastName === false && !formData.lastName ? t('validation:name.lastName') : ''}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label={t('auth:receptionistRegistration.personalInfo.email')}
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  onFocus={handleFocus('email')}
                  onBlur={handleBlur('email')}
                  required
                  error={!!(focus.email === false && (!formData.email || !validation.email))}
                  helperText={
                    focus.email === false && !formData.email 
                      ? t('validation:email.required') 
                      : focus.email === false && formData.email && !validation.email 
                      ? t('validation:email.invalid') 
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
                  label={t('auth:receptionistRegistration.personalInfo.phone')}
                  value={formData.phoneNumber}
                  onChange={handleInputChange('phoneNumber')}
                  onFocus={handleFocus('phoneNumber')}
                  onBlur={handleBlur('phoneNumber')}
                  required
                  error={!!(focus.phoneNumber === false && (!formData.phoneNumber || !validation.phone))}
                  helperText={
                    focus.phoneNumber === false && !formData.phoneNumber 
                      ? t('validation:phone.required') 
                      : focus.phoneNumber === false && formData.phoneNumber && !validation.phone 
                      ? t('validation:phone.invalid') 
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
                  label={t('auth:receptionistRegistration.personalInfo.password')}
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  onFocus={handleFocus('password')}
                  onBlur={handleBlur('password')}
                  required
                  error={!!(focus.password === false && (!formData.password || !validation.password))}
                  helperText={
                    focus.password === false && !formData.password 
                      ? t('validation:password.required') 
                      : focus.password === false && formData.password && !validation.password 
                      ? t('validation:password.pattern') 
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
                  label={t('auth:receptionistRegistration.personalInfo.confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  onFocus={handleFocus('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  required
                  error={!!(focus.confirmPassword === false && (!formData.confirmPassword || !validation.confirmPassword))}
                  helperText={
                    focus.confirmPassword === false && !formData.confirmPassword 
                      ? t('validation:required') 
                      : focus.confirmPassword === false && formData.confirmPassword && !validation.confirmPassword 
                      ? t('validation:password.noMatch') 
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
                  <FormLabel component="legend" sx={{ color: '#333', fontWeight: 'bold' }}>{t('auth:receptionistRegistration.personalInfo.gender')}</FormLabel>
                  <RadioGroup
                    row
                    value={formData.sex}
                    onChange={handleInputChange('sex')}
                  >
                    <FormControlLabel value="Male" control={<Radio />} label={t('auth:receptionistRegistration.personalInfo.male')} />
                    <FormControlLabel value="Female" control={<Radio />} label={t('auth:receptionistRegistration.personalInfo.female')} />
                  </RadioGroup>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label={t('auth:receptionistRegistration.personalInfo.dateOfBirth')}
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange('dateOfBirth')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  label={t('auth:receptionistRegistration.personalInfo.address')}
                  value={formData.address}
                  onChange={handleInputChange('address')}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <StyledTextField
                  fullWidth
                  label={t('auth:receptionistRegistration.personalInfo.city')}
                  value={formData.city}
                  onChange={handleInputChange('city')}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <StyledTextField
                  fullWidth
                  label={t('auth:receptionistRegistration.personalInfo.state')}
                  value={formData.state}
                  onChange={handleInputChange('state')}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <StyledTextField
                  fullWidth
                  label={t('auth:receptionistRegistration.personalInfo.zipCode')}
                  value={formData.zipCode}
                  onChange={handleInputChange('zipCode')}
                />
              </Grid>
              
              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  label={t('auth:receptionistRegistration.personalInfo.country')}
                  value={formData.country}
                  onChange={handleInputChange('country')}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  label={t('auth:receptionistRegistration.personalInfo.bioLabel')}
                  placeholder={t('auth:receptionistRegistration.personalInfo.bioPlaceholder')}
                  value={formData.bio}
                  onChange={handleInputChange('bio')}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        );
        
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333', mb: 3 }}>
              {t('auth:receptionistRegistration.experience.title')}
            </Typography>

            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <AlertTitle>{t('auth:receptionistRegistration.experience.optionalTitle')}</AlertTitle>
              {t('auth:receptionistRegistration.experience.optionalMessage')}
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Button variant="outlined" onClick={handleAddExperience}>
                {t('auth:receptionistRegistration.experience.add')}
              </Button>
            </Box>

            <Grid container spacing={3}>
              {experiences.map((exp, index) => (
                <Grid item xs={12} key={`experience-${index}`}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {t('auth:receptionistRegistration.experience.entryTitle', { index: index + 1 })}
                        </Typography>
                        <Button color="error" onClick={() => handleRemoveExperience(index)}>
                          {t('auth:receptionistRegistration.experience.remove')}
                        </Button>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <StyledTextField
                            fullWidth
                            label={t('auth:receptionistRegistration.experience.organizationName')}
                            value={exp.organizationName}
                            onChange={handleExperienceChange(index, 'organizationName')}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <StyledTextField
                            fullWidth
                            label={t('auth:receptionistRegistration.experience.positionTitle')}
                            value={exp.positionTitle}
                            onChange={handleExperienceChange(index, 'positionTitle')}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <StyledTextField
                            fullWidth
                            label={t('auth:receptionistRegistration.experience.location')}
                            value={exp.location}
                            onChange={handleExperienceChange(index, 'location')}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <StyledTextField
                            fullWidth
                            label={t('auth:receptionistRegistration.experience.startDate')}
                            type="date"
                            value={exp.startDate}
                            onChange={handleExperienceChange(index, 'startDate')}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <StyledTextField
                            fullWidth
                            label={t('auth:receptionistRegistration.experience.endDate')}
                            type="date"
                            value={exp.endDate}
                            onChange={handleExperienceChange(index, 'endDate')}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <StyledTextField
                            fullWidth
                            label={t('auth:receptionistRegistration.experience.description')}
                            value={exp.description}
                            onChange={handleExperienceChange(index, 'description')}
                            multiline
                            rows={3}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
        
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333', mb: 3 }}>
              {t('auth:receptionistRegistration.review.title')}
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <AlertTitle>{t('auth:receptionistRegistration.review.nextStepsAlert.title')}</AlertTitle>
              {t('auth:receptionistRegistration.review.nextStepsAlert.message')}
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: '#667eea', fontWeight: 'bold' }}>
                      {t('auth:receptionistRegistration.review.personalInfoCard')}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>{t('auth:receptionistRegistration.review.name')}:</strong> {formData.firstName} {formData.lastName}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>{t('auth:receptionistRegistration.review.email')}:</strong> {formData.email}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>{t('auth:receptionistRegistration.review.phone')}:</strong> {formData.phoneNumber}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>{t('auth:receptionistRegistration.review.gender')}:</strong> {formData.sex || t('auth:receptionistRegistration.review.notSpecified')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('auth:receptionistRegistration.review.dateOfBirth')}:</strong> {formData.dateOfBirth || t('auth:receptionistRegistration.review.notSpecified')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: '#667eea', fontWeight: 'bold' }}>
                      {t('auth:receptionistRegistration.review.experienceCard')}
                    </Typography>
                    {experiences.length === 0 ? (
                      <Typography variant="body2">
                        {t('auth:receptionistRegistration.review.noExperience')}
                      </Typography>
                    ) : (
                      experiences.map((exp, idx) => (
                        <Box key={`review-exp-${idx}`} sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {exp.organizationName || t('auth:receptionistRegistration.review.notSpecified')}
                          </Typography>
                          <Typography variant="body2">
                            {exp.positionTitle || t('auth:receptionistRegistration.review.notSpecified')}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </CardContent>
                </Card>
              </Grid>
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
            {t('auth:receptionistRegistration.success.title')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            {t('auth:receptionistRegistration.success.message')}
          </Typography>
          <ModernButton
            variant="contained"
            component={Link}
            to="/login"
            sx={{ bgcolor: 'white', color: '#4caf50' }}
            endIcon={<ArrowForward />}
          >
            {t('auth:receptionistRegistration.success.signInButton')}
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
              {t('common:buttons.back')}
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
                {loading ? t('auth:receptionistRegistration.buttons.registering') : t('auth:receptionistRegistration.buttons.completeRegistration')}
              </ModernButton>
            ) : (
              <ModernButton
                variant="contained"
                onClick={handleNext}
                disabled={!validateStep(activeStep)}
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
            {t('auth:receptionistRegistration.alreadyHaveAccount')}{' '}
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
              {t('auth:receptionistRegistration.signIn')}
            </Button>
          </Typography>
        </Box>
      </RegisterPaper>
    </RegisterContainer>
  );
};

export default RegisterReceptionistPage;

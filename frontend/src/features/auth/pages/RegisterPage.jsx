import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
  Support as SupportIcon,
  ArrowForward,
  CheckCircle,
} from '@mui/icons-material';

const RegisterContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  border: '5px solid #667eea',
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

const OptionCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  border: '2px solid transparent',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[12],
    borderColor: '#667eea',
  },
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  position: 'relative',
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
  marginBottom: theme.spacing(2),
  color: 'white',
  '& svg': {
    fontSize: 40,
  },
}));

const RegisterButton = styled(Button)(({ theme }) => ({
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
}));

const FeatureList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  marginTop: theme.spacing(2),
}));

const FeatureItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: theme.palette.text.secondary,
  fontSize: '0.9rem',
}));

const RegisterPage = () => {
  const theme = useTheme();
  const { t } = useTranslation(['auth', 'common']);

  const patientFeatures = [
    t('auth:register.patient.features.bookAppointments'),
    t('auth:register.patient.features.accessRecords'),
    t('auth:register.patient.features.chatAssistant'),
    t('auth:register.patient.features.managePrescriptions'),
    t('auth:register.patient.features.trackMetrics'),
    t('auth:register.patient.features.receiveReminders'),
  ];

  const doctorFeatures = [
    t('auth:register.doctor.features.manageAppointments'),
    t('auth:register.doctor.features.createReports'),
    t('auth:register.doctor.features.accessHistory'),
    t('auth:register.doctor.features.shareDocuments'),
    t('auth:register.doctor.features.communicatePatients'),
    t('auth:register.doctor.features.analyticsDashboard'),
  ];

  const receptionistFeatures = [
    t('auth:register.receptionist.features.manageDoctorAppointments'),
    t('auth:register.receptionist.features.registerPatients'),
    t('auth:register.receptionist.features.verifyDocuments'),
    t('auth:register.receptionist.features.handleScheduling'),
    t('auth:register.receptionist.features.processCheckins'),
    t('auth:register.receptionist.features.adminDashboard'),
  ];

  return (
    <RegisterContainer>
      <RegisterPaper elevation={10}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
            {t('auth:register.title')}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            {t('auth:register.subtitle')}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Patient Registration */}
          <Grid item xs={12} md={4}>
            <OptionCard>
              <CardContent sx={{ p: 4, textAlign: 'center', flexGrow: 1 }}>
                <IconWrapper>
                  <PersonIcon />
                </IconWrapper>
                <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                  {t('auth:register.patient.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {t('auth:register.patient.description')}
                </Typography>
                
                <FeatureList>
                  {patientFeatures.map((feature, index) => (
                    <FeatureItem key={index}>
                      <CheckCircle sx={{ color: '#667eea', fontSize: 16 }} />
                      <Typography variant="body2">{feature}</Typography>
                    </FeatureItem>
                  ))}
                </FeatureList>
              </CardContent>
              <CardActions sx={{ p: 4, pt: 0 }}>
                <RegisterButton
                  fullWidth
                  variant="contained"
                  component={Link}
                  to="/register-patient"
                  endIcon={<ArrowForward />}
                >
                  {t('auth:register.patient.button')}
                </RegisterButton>
              </CardActions>
            </OptionCard>
          </Grid>

          {/* Doctor Registration */}
          <Grid item xs={12} md={4}>
            <OptionCard>
              <CardContent sx={{ p: 4, textAlign: 'center', flexGrow: 1 }}>
                <IconWrapper>
                  <HospitalIcon />
                </IconWrapper>
                <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                  {t('auth:register.doctor.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {t('auth:register.doctor.description')}
                </Typography>
                
                <FeatureList>
                  {doctorFeatures.map((feature, index) => (
                    <FeatureItem key={index}>
                      <CheckCircle sx={{ color: '#667eea', fontSize: 16 }} />
                      <Typography variant="body2">{feature}</Typography>
                    </FeatureItem>
                  ))}
                </FeatureList>
              </CardContent>
              <CardActions sx={{ p: 4, pt: 0 }}>
                <RegisterButton
                  fullWidth
                  variant="contained"
                  component={Link}
                  to="/register-doctor"
                  endIcon={<ArrowForward />}
                >
                  {t('auth:register.doctor.button')}
                </RegisterButton>
              </CardActions>
            </OptionCard>
          </Grid>

          {/* Receptionist Registration */}
          <Grid item xs={12} md={4}>
            <OptionCard>
              <CardContent sx={{ p: 4, textAlign: 'center', flexGrow: 1 }}>
                <IconWrapper>
                  <SupportIcon />
                </IconWrapper>
                <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                  {t('auth:register.receptionist.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {t('auth:register.receptionist.description')}
                </Typography>
                
                <FeatureList>
                  {receptionistFeatures.map((feature, index) => (
                    <FeatureItem key={index}>
                      <CheckCircle sx={{ color: '#667eea', fontSize: 16 }} />
                      <Typography variant="body2">{feature}</Typography>
                    </FeatureItem>
                  ))}
                </FeatureList>
              </CardContent>
              <CardActions sx={{ p: 4, pt: 0 }}>
                <RegisterButton
                  fullWidth
                  variant="contained"
                  component={Link}
                  to="/register-receptionist"
                  endIcon={<ArrowForward />}
                >
                  {t('auth:register.receptionist.button')}
                </RegisterButton>
              </CardActions>
            </OptionCard>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="body1" color="text.secondary">
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

export default RegisterPage;

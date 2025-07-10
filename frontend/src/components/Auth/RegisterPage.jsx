import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
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
  PersonAdd as PersonAddIcon,
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const patientFeatures = [
    'Book appointments with doctors',
    'Access medical records',
    'Chat with AI health assistant',
    'Manage prescriptions',
    'Track health metrics',
    'Receive appointment reminders',
  ];

  const doctorFeatures = [
    'Manage patient appointments',
    'Create medical reports',
    'Access patient history',
    'Share medical documents',
    'Communicate with patients',
    'Advanced analytics dashboard',
  ];

  return (
    <RegisterContainer>
      <RegisterPaper elevation={10}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
            Join Our Platform 🎉
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Choose your registration type to get started with our comprehensive healthcare management system
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Patient Registration */}
          <Grid item xs={12} md={6}>
            <OptionCard>
              <CardContent sx={{ p: 4, textAlign: 'center', flexGrow: 1 }}>
                <IconWrapper>
                  <PersonIcon />
                </IconWrapper>
                <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                  Patient
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Register as a patient to access healthcare services, book appointments, and manage your medical records.
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
                  Register as Patient
                </RegisterButton>
              </CardActions>
            </OptionCard>
          </Grid>

          {/* Doctor Registration */}
          <Grid item xs={12} md={6}>
            <OptionCard>
              <CardContent sx={{ p: 4, textAlign: 'center', flexGrow: 1 }}>
                <IconWrapper>
                  <HospitalIcon />
                </IconWrapper>
                <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                  Doctor
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Register as a healthcare professional to manage patients, create reports, and provide medical consultations.
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
                  Register as Doctor
                </RegisterButton>
              </CardActions>
            </OptionCard>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="body1" color="text.secondary">
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

export default RegisterPage;

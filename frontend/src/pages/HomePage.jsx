import React, { useState, useEffect, Suspense, useContext } from 'react';
import { Link } from 'react-router-dom';
import { RecoilRoot } from "recoil";
import { Box, Container, Typography, Grid, Card, CardContent, Button, Paper, useTheme, useMediaQuery } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  LocalHospital, 
  Schedule, 
  Chat, 
  PersonalVideo, 
  Security, 
  Speed,
  ArrowForward,
  Star
} from '@mui/icons-material';
import { AuthContext } from '../components/Auth/AuthContext';
import Testimonials from "../components/Testimonals/Testimonals";
import AgePieChart from '../components/common/Charts/AgePieChart';
import stetoImage from "./../assets/images/no_background_doc_steto.png";

// Styled components
const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: theme.spacing(8, 0),
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.1)',
    zIndex: 1,
  },
}));

const HeroContent = styled(Container)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
}));

const ServiceCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[8],
  },
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
}));

const FeatureIcon = styled(Box)(({ theme }) => ({
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

const StatsSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  padding: theme.spacing(6, 0),
}));

const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  height: '100%',
  background: 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const CTASection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: theme.spacing(8, 0),
  textAlign: 'center',
}));

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 4),
  fontSize: '1.1rem',
  fontWeight: 'bold',
  textTransform: 'none',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

function HomePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isLoggedIn } = useContext(AuthContext);

  const services = [
    {
      icon: <LocalHospital />,
      title: "Expert Medical Care",
      description: "Access to qualified healthcare professionals and specialists for comprehensive medical treatment."
    },
    {
      icon: <Schedule />,
      title: "Easy Appointment Booking",
      description: "Schedule your appointments online with just a few clicks. No more waiting in long queues."
    },
    {
      icon: <Chat />,
      title: "24/7 Medical Chat",
      description: "Get instant medical advice and support through our AI-powered chatbot available round the clock."
    },
    {
      icon: <PersonalVideo />,
      title: "Telemedicine",
      description: "Consult with doctors remotely through secure video calls from the comfort of your home."
    },
    {
      icon: <Security />,
      title: "Secure & Private",
      description: "Your medical data is protected with enterprise-grade security and privacy measures."
    },
    {
      icon: <Speed />,
      title: "Fast & Efficient",
      description: "Quick access to medical services with minimal waiting time and streamlined processes."
    }
  ];

  const stats = [
    { value: "10,000+", label: "Happy Patients" },
    { value: "500+", label: "Expert Doctors" },
    { value: "50+", label: "Medical Specialties" },
    { value: "24/7", label: "Emergency Support" }
  ];

  // Sample data for charts
  const patientData = {
    labels: ['18-25', '26-35', '36-45', '46-60', '60+'],
    values: [20, 30, 25, 15, 10]
  };

  const doctorData = {
    labels: ['General', 'Specialist', 'Surgeon', 'Consultant'],
    values: [35, 40, 15, 10]
  };

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <HeroSection>
        <HeroContent maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                Your Health, Our Priority
              </Typography>
              <Typography variant="h5" component="p" gutterBottom sx={{ mb: 4, opacity: 0.9 }}>
                Experience modern healthcare with our comprehensive medical platform. 
                Book appointments, consult with doctors, and manage your health records all in one place.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center' }}>
                {!isLoggedIn ? (
                  <>
                    <ModernButton
                      variant="contained"
                      size="large"
                      component={Link}
                      to="/register"
                      sx={{
                        bgcolor: 'white',
                        color: '#667eea',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.9)',
                        },
                      }}
                      endIcon={<ArrowForward />}
                    >
                      Get Started
                    </ModernButton>
                    <ModernButton
                      variant="outlined"
                      size="large"
                      component={Link}
                      to="/login"
                      sx={{
                        borderColor: 'white',
                        color: 'white',
                        '&:hover': {
                          borderColor: 'white',
                          bgcolor: 'rgba(255,255,255,0.1)',
                        },
                      }}
                    >
                      Sign In
                    </ModernButton>
                  </>
                ) : (
                  <ModernButton
                    variant="contained"
                    size="large"
                    component={Link}
                    to="/patient-appointments"
                    sx={{
                      bgcolor: 'white',
                      color: '#667eea',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                      },
                    }}
                    endIcon={<ArrowForward />}
                  >
                    Go to Dashboard
                  </ModernButton>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center', display: { xs: 'none', md: 'block' } }}>
                <img 
                  src={stetoImage} 
                  alt="Healthcare Professional" 
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto',
                    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))'
                  }} 
                />
              </Box>
            </Grid>
          </Grid>
        </HeroContent>
      </HeroSection>

      {/* Services Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ fontWeight: 'bold', mb: 6 }}>
          Why Choose Our Platform?
        </Typography>
        <Grid container spacing={4}>
          {services.map((service, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <ServiceCard>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <FeatureIcon>
                    {service.icon}
                  </FeatureIcon>
                  <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {service.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {service.description}
                  </Typography>
                </CardContent>
              </ServiceCard>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Stats Section */}
      <StatsSection>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ fontWeight: 'bold', mb: 6 }}>
            Trusted by Thousands
          </Typography>
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <StatCard elevation={3}>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#667eea', mb: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="h6" component="div" color="text.secondary">
                    {stat.label}
                  </Typography>
                </StatCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </StatsSection>

      {/* Charts Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ fontWeight: 'bold', mb: 6 }}>
            Our Community
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={4} 
                sx={{ 
                  p: 4, 
                  borderRadius: 3, 
                  minHeight: 450, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  border: '1px solid #e3f2fd'
                }}
              >
                <AgePieChart data={patientData} title="Patient Demographics" />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={4} 
                sx={{ 
                  p: 4, 
                  borderRadius: 3, 
                  minHeight: 450, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}
              >
                <AgePieChart data={doctorData} title="Doctor Specializations" textColor="white" />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ fontWeight: 'bold', mb: 6 }}>
            What Our Users Say
          </Typography>
          <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
            <RecoilRoot>
              <Suspense fallback={<Typography textAlign="center">Loading testimonials...</Typography>}>
                <Testimonials />
              </Suspense>
            </RecoilRoot>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      {!isLoggedIn && (
        <CTASection>
          <Container maxWidth="md">
            <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Ready to Transform Your Healthcare Experience?
            </Typography>
            <Typography variant="h6" component="p" gutterBottom sx={{ mb: 4, opacity: 0.9 }}>
              Join thousands of satisfied patients and healthcare professionals on our platform.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center' }}>
              <ModernButton
                variant="contained"
                size="large"
                component={Link}
                to="/register"
                sx={{
                  bgcolor: 'white',
                  color: '#667eea',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                  },
                }}
                endIcon={<ArrowForward />}
              >
                Get Started Today
              </ModernButton>
              <ModernButton
                variant="outlined"
                size="large"
                component={Link}
                to="/login"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Sign In
              </ModernButton>
            </Box>
          </Container>
        </CTASection>
      )}
    </Box>
  );
}

export default HomePage;

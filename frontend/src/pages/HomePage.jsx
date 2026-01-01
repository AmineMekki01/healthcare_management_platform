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
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../features/auth/context/AuthContext';
import AgePieChart from '../components/common/Charts/AgePieChart';
import axios from '../components/axiosConfig';
import stetoImage from "./../assets/images/no_background_doc_steto.png";

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
  const { isLoggedIn } = useContext(AuthContext);
  const { t, i18n} = useTranslation(['common', 'medical']);
  const isRTL = i18n.language === 'ar';

  const [communityStats, setCommunityStats] = useState(null);
  const [communityStatsLoading, setCommunityStatsLoading] = useState(false);

  const formatNumber = (value) => {
    const n = typeof value === 'number' ? value : 0;
    return new Intl.NumberFormat(i18n.language).format(n);
  };

  const toPieData = (items, { maxItems = null } = {}) => {
    if (!Array.isArray(items) || items.length === 0) {
      return { labels: [], values: [] };
    }

    const filtered = items.filter((item) => (item?.count || 0) > 0);
    if (filtered.length === 0) {
      return { labels: [], values: [] };
    }

    let finalItems = filtered;
    if (typeof maxItems === 'number' && maxItems > 0 && filtered.length > maxItems) {
      const top = filtered.slice(0, maxItems);
      const rest = filtered.slice(maxItems);
      const restCount = rest.reduce((sum, item) => sum + (item?.count || 0), 0);
      finalItems = restCount > 0
        ? [...top, { label: t('common:homepage.community.other'), count: restCount }]
        : top;
    }

    return {
      labels: finalItems.map((item) => item.label),
      values: finalItems.map((item) => item.count),
    };
  };

  useEffect(() => {
    let mounted = true;
    const fetchCommunityStats = async () => {
      setCommunityStatsLoading(true);
      try {
        const response = await axios.get('/api/v1/community/stats');
        console.log('Community stats:', response.data);
        if (mounted) {
          setCommunityStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch community stats:', error);
        if (mounted) {
          setCommunityStats(null);
        }
      } finally {
        if (mounted) {
          setCommunityStatsLoading(false);
        }
      }
    };

    fetchCommunityStats();
    return () => {
      mounted = false;
    };
  }, []);

  const services = [
    {
      icon: <LocalHospital />,
      title: t('common:homepage.services.expertCare.title'),
      description: t('common:homepage.services.expertCare.description')
    },
    {
      icon: <Schedule />,
      title: t('common:homepage.services.easyBooking.title'),
      description: t('common:homepage.services.easyBooking.description')
    },
    {
      icon: <Chat />,
      title: t('common:homepage.services.medicalChat.title'),
      description: t('common:homepage.services.medicalChat.description')
    },
    {
      icon: <PersonalVideo />,
      title: t('common:homepage.services.telemedicine.title'),
      description: t('common:homepage.services.telemedicine.description')
    },
    {
      icon: <Security />,
      title: t('common:homepage.services.secure.title'),
      description: t('common:homepage.services.secure.description')
    },
    {
      icon: <Speed />,
      title: t('common:homepage.services.efficient.title'),
      description: t('common:homepage.services.efficient.description')
    }
  ];

  const totals = communityStats?.totals;
  const receptionistBreakdown =
    !communityStatsLoading &&
    typeof totals?.receptionistsAssigned === 'number' &&
    typeof totals?.receptionistsUnassigned === 'number'
      ? `${t('common:homepage.community.receptionists.assigned')}: ${formatNumber(totals.receptionistsAssigned)} | ${t('common:homepage.community.receptionists.unassigned')}: ${formatNumber(totals.receptionistsUnassigned)}`
      : null;

  const receptionistChartData =
    !communityStatsLoading &&
    typeof totals?.receptionistsAssigned === 'number' &&
    typeof totals?.receptionistsUnassigned === 'number'
      ? {
          labels: [
            t('common:homepage.community.receptionists.assigned'),
            t('common:homepage.community.receptionists.unassigned'),
          ],
          values: [totals.receptionistsAssigned, totals.receptionistsUnassigned],
        }
      : { labels: [], values: [] };
  const stats = [
    {
      value: communityStatsLoading ? '—' : formatNumber(totals?.patients),
      label: t('common:homepage.community.totals.patients'),
    },
    {
      value: communityStatsLoading ? '—' : formatNumber(totals?.doctors),
      label: t('common:homepage.community.totals.doctors'),
    },
    {
      value: communityStatsLoading ? '—' : formatNumber(totals?.receptionists),
      label: t('common:homepage.community.totals.receptionists'),
      subLabel: receptionistBreakdown,
    },
    {
      value: communityStatsLoading ? '—' : formatNumber(totals?.specialties),
      label: t('common:homepage.community.totals.specialties'),
    },
  ];

  const patientData = toPieData(communityStats?.patientsByAge);
  const mapSpecialtyKey = (rawLabel) => {
    const raw = (rawLabel ?? '').toString().trim();
    const normalized = raw.toLowerCase().trim();

    const toCamelCase = (value) => {
      const cleaned = (value ?? '')
        .toString()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s-_]/g, ' ')
        .trim();

      const parts = cleaned.split(/[\s-_]+/).filter(Boolean);
      if (parts.length === 0) {
        return '';
      }
      return parts[0] + parts.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    };

    const map = {
      'general': 'generalPractice',
      'general practice': 'generalPractice',
      'internal medicine': 'internalMedicine',
      'family medicine': 'familyMedicine',
      'obstetrics and gynecology': 'obstetricsGynecology',
      'obstetrics & gynecology': 'obstetricsGynecology',
      'obstetrics gynecology': 'obstetricsGynecology',
      'ent': 'otolaryngology',
      'orl': 'otolaryngology',
      'oto rhino laryngology': 'otolaryngology',
      'oto-rhino-laryngology': 'otolaryngology',
      'gastro enterology': 'gastroenterology',
      'gastro-enterology': 'gastroenterology',
    };

    return map[normalized] || toCamelCase(normalized) || normalized;
  };

  const getLocalizedSpecialtyLabel = (rawLabel) => {
    const raw = (rawLabel ?? '').toString().trim();
    if (!raw || raw.toLowerCase() === 'unknown') {
      return t('common:homepage.community.unknown');
    }

    const key = mapSpecialtyKey(raw);
    const translated = t(`medical:specialties.${key}`, { defaultValue: '' });
    return translated || raw;
  };

  const doctorSpecialtyItems = Array.isArray(communityStats?.doctorsBySpecialty)
    ? communityStats.doctorsBySpecialty.map((item) => ({
        ...item,
        label: getLocalizedSpecialtyLabel(item?.label),
      }))
    : [];
  const doctorData = toPieData(doctorSpecialtyItems, { maxItems: 7 });

  return (
    
    <Box sx={{ bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <HeroSection>
        <HeroContent maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                {t('common:homepage.hero.title')}
              </Typography>
              <Typography variant="h5" component="p" gutterBottom sx={{ mb: 4, opacity: 0.9 }}>
                {t('common:homepage.hero.subtitle')}
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
                        display: 'flex',
                       
                      }}
                    >
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        {t('common:buttons.getStartedToday')}
                      </Typography>
                      <ArrowForward 
                      sx={{
                        transform: isRTL ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                      />
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
                      {t('common:buttons.signIn')}
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
                      '& svg': {
                        transform: isRTL ? 'rotate(180deg)' : 'rotate(0deg)',
                      },
                    }}
                  >
                    <Typography variant="body1" sx={{ ml: 1 }}>
                      {t('common:buttons.goToDashboard')}
                    </Typography>
                    <ArrowForward />
                    
                  </ModernButton>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center', display: { xs: 'none', md: 'block' } }}>
                <img 
                  src={stetoImage} 
                  alt={t('common:homepage.hero.imageAlt')} 
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
          {t('common:homepage.sections.whyChoose')}
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
            {t('common:homepage.sections.trustedByThousands')}
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
                  {stat.subLabel ? (
                    <Typography variant="body2" component="div" color="text.secondary" sx={{ mt: 1 }}>
                      {stat.subLabel}
                    </Typography>
                  ) : null}
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
            {t('common:homepage.sections.ourCommunity')}
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={4}>
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
                <AgePieChart data={patientData} title={t('common:homepage.community.charts.patientsByAge')} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
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
                <AgePieChart data={doctorData} title={t('common:homepage.community.charts.doctorsBySpecialty')} textColor="white" />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
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
                  background: 'linear-gradient(135deg, #2dd4bf 0%, #0ea5e9 100%)',
                  color: 'white'
                }}
              >
                <AgePieChart
                  data={receptionistChartData}
                  title={t('common:homepage.community.charts.receptionistsByAssignment')}
                  textColor="white"
                />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      {!isLoggedIn && (
        <CTASection>
          <Container maxWidth="md">
            <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              {t('common:homepage.cta.title')}
            </Typography>
            <Typography variant="h6" component="p" gutterBottom sx={{ mb: 4, opacity: 0.9 }}>
              {t('common:homepage.cta.subtitle')}
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
                {t('common:buttons.getStartedToday')}
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
                {t('common:buttons.signIn')}
              </ModernButton>
            </Box>
          </Container>
        </CTASection>
      )}
    </Box>
  );
}

export default HomePage;

import { useState, useEffect } from 'react';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export const useMobileNavigation = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY;

      if (scrollDelta > 5 && currentScrollY > 100) {
        setIsBottomNavVisible(false);
        setIsHeaderVisible(false);
      } else if (scrollDelta < -5) {
        setIsBottomNavVisible(true);
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    if (isMobile) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isMobile, lastScrollY]);

  useEffect(() => {
    if (!isMobile) {
      setIsBottomNavVisible(true);
      setIsHeaderVisible(true);
    }
  }, [isMobile]);

  return {
    isMobile,
    isBottomNavVisible,
    isHeaderVisible,
    setIsBottomNavVisible,
    setIsHeaderVisible,
  };
};

export const shouldShowBackButton = (pathname) => {
  const noBackButtonRoutes = ['/', '/SearchBar', '/Messages', '/appointments'];
  return !noBackButtonRoutes.includes(pathname);
};

export const getMobilePageTitle = (pathname, activeMode, t) => {
  const titleKeyMap = {
    '/': 'home',
    '/SearchBar': 'findDoctors',
    '/Messages': 'messages',
    '/appointments': 'appointments',
    '/feed': 'healthFeed',
    '/settings': 'settings',
    '/receptionist-dashboard': 'receptionistDashboard',
    '/receptionist/job-offers': 'jobOffers',
    '/receptionist/patients': 'patientSearch',
    '/receptionist/create-patient': 'createPatient',
    '/receptionist/create-appointment': 'scheduleAppointment',
    '/staff-management': 'staffManagement',
    '/records': 'myDocuments',
    '/MyDocs': 'myDocuments',
    '/create-post': 'createPost',
    '/doctor-posts': 'myPosts',
    '/ChatBot': 'aiAssistant',
  };

  if (typeof t === 'function') {
    if (pathname.includes('/doctor-profile/')) return t('navigation.profile');
    if (pathname.includes('/patient-profile/')) return t('navigation.profile');
    if (pathname.includes('/receptionist-profile/')) return t('navigation.profile');
    if (pathname.includes('/medical-report/')) return t('navigation.medicalReports');
    if (pathname.includes('/settings/')) return t('navigation.settings');

    const titleKey = titleKeyMap[pathname];
    if (titleKey) {
      return t(`navigation.${titleKey}`);
    }

    if (activeMode === 'doctor' || activeMode === 'patient' || activeMode === 'receptionist') {
      return t(`userTypes.${activeMode}`);
    }

    return t('navigation.platformName');
  }

  return titleKeyMap[pathname] || 'Healthcare Platform';
};

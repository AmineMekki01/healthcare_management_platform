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

export const getMobilePageTitle = (pathname, activeMode) => {
  const titleMap = {
    '/': 'Home',
    '/SearchBar': 'Find Doctors',
    '/Messages': 'Messages',
    '/appointments': 'Appointments',
    '/feed': 'Health Feed',
    '/patient-medical-history': 'Medical History',
    '/settings': 'Settings',
    '/receptionist-dashboard': 'Dashboard',
    '/receptionist/job-offers': 'Job Offers',
    '/staff-management': 'Staff',
    '/MyDocs': 'My Documents',
    '/create-post': 'Create Post',
    '/doctor-posts': 'My Posts',
    '/ChatBot': 'AI Assistant',
  };

  if (pathname.includes('/doctor-profile/')) return 'Doctor Profile';
  if (pathname.includes('/patient-profile/')) return 'Patient Profile';
  if (pathname.includes('/receptionist-profile/')) return 'Profile';
  if (pathname.includes('/medical-report/')) return 'Medical Reports';
  if (pathname.includes('/settings/')) return 'Settings';

  if (!titleMap[pathname]) {
    if (activeMode === 'doctor') return 'Doctor Portal';
    if (activeMode === 'patient') return 'Patient Portal';
    if (activeMode === 'receptionist') return 'Receptionist Portal';
  }

  return titleMap[pathname] || 'Healthcare Platform';
};

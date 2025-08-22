import React, { useContext } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from './../../../features/auth/context/AuthContext';
import { useSidebar } from '../../../contexts/SidebarContext';
import MyNavbar from '../navbar/Navbar';
import PublicNavbar from '../navbar/PublicNavbar';
import BottomNavbar from '../navbar/BottomNavbar';
import MobileHeader from '../navbar/MobileHeader';

const Layout = ({ children }) => {
  const { isLoggedIn } = useContext(AuthContext);
  const { sidebarOpen } = useSidebar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const sidebarWidth = 0;

  if (!isLoggedIn) {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <PublicNavbar />
        {children}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isMobile && <MobileHeader />}
      
      {!isMobile && <MyNavbar />}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: isMobile ? 0 : `${sidebarWidth}px`,
          width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`,
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          paddingTop: isMobile ? '64px' : 0,
          paddingBottom: isMobile ? '70px' : 0,
        }}
      >
        <Box sx={{ padding: '24px' }}>
          {children}
        </Box>
      </Box>
      
      <BottomNavbar />
    </Box>
  );
};

export default Layout;

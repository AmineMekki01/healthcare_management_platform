import React, { useContext } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Typography,
  ListItemIcon,
  ListItemText,
  Slide,
  useScrollTrigger,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Home as HomeIcon,
  Description as DescriptionIcon,
  Feed as FeedIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  MoreVert as MoreVertIcon,
  Badge as BadgeIcon,
  PersonOutline as PersonOutlineIcon,
  Dashboard as DashboardIcon,
  Assignment as ReportsIcon,
  Groups as StaffIcon,
  Create as CreateIcon,
  Newspaper as NewsIcon,
  PersonSearch as DoctorSearchIcon,
  CalendarMonth as CalendarIcon,
  Textsms as MessagesIcon,
  AccountCircle as ProfileIcon,
  ManageAccounts as ManageIcon,
} from '@mui/icons-material';
import { AuthContext } from '../../../features/auth/context/AuthContext';
import { useRoleMode } from '../../../contexts/RoleModeContext';

const BottomNavbar = () => {
  const { 
    isLoggedIn, 
    logout, 
    userId, 
    userType, 
    userFullName, 
    userProfilePictureUrl 
  } = useContext(AuthContext);
  const { activeMode, canSwitchModes, handleModeToggle } = useRoleMode();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const trigger = useScrollTrigger({
    target: window,
    threshold: 100,
  });

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (!isMobile || !isLoggedIn) {
    return null;
  }

  const profileHref =
    userType === 'doctor'
      ? `/doctor-profile/${userId}`
      : userType === 'patient' ? `/patient-profile/${userId}` : `/receptionist-profile/${userId}`;

  const getMainNavItems = () => {
    const baseItems = [
      {
        label: 'Home',
        value: '/',
        icon: <HomeIcon />,
      },
      {
        label: 'Find Doctors',
        value: '/SearchBar',
        icon: <DoctorSearchIcon />,
      },
      {
        label: 'Health Feed',
        value: '/feed',
        icon: <FeedIcon />,
      },
    ];

    if (activeMode === 'patient') {
      baseItems.push({
        label: 'Appointments',
        value: '/appointments',
        icon: <CalendarIcon />,
      });
    } else if (activeMode === 'doctor') {
      baseItems.push({
        label: 'Schedule',
        value: '/appointments',
        icon: <CalendarIcon />,
      });
    } else if (activeMode === 'receptionist') {
      baseItems.push({
        label: 'Dashboard',
        value: '/receptionist-dashboard',
        icon: <DashboardIcon />,
      });
    }

    return baseItems;
  };

  const mainNavItems = getMainNavItems();

  const getMenuItems = () => {
    const baseItems = [
      {
        label: 'Profile',
        href: profileHref,
        icon: <ProfileIcon />,
      },{
        label: 'Messages',
        value: '/Messages',
        icon: <MessagesIcon />,
      },
    ];
          

    if (activeMode === 'patient') {
      
    } else if (activeMode === 'doctor') {
      baseItems.unshift(
        {
          label: 'Medical Reports',
          href: `/medical-report/${userId}`,
          icon: <ReportsIcon />,
        },
        {
          label: 'Staff Management',
          href: '/staff-management',
          icon: <StaffIcon />,
        },
        {
          label: 'Create Post',
          href: '/create-post',
          icon: <CreateIcon />,
        },
        {
          label: 'My Articles',
          href: '/doctor-posts',
          icon: <NewsIcon />,
        }
      );
    }

    baseItems.push(
        {
            label: 'My Documents',
            href: '/records',
            icon: <DescriptionIcon />,
        },
        {
            label: 'Settings',
            href: `/settings/${userId}`,
            icon: <SettingsIcon />,
        },
        {
            label: 'Logout',
            action: logout,
            icon: <LogoutIcon />,
        }
    );

    return baseItems;
  };

  const menuItems = getMenuItems();

  const currentValue = mainNavItems.find(item => 
    location.pathname === item.value
  )?.value || '';

  return (
    <>
      <Slide appear={false} direction="up" in={!trigger}>
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.bottomNavigation || 1000,
            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: '16px 16px 0 0',
            backdropFilter: 'blur(10px)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '40px',
              height: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '2px',
              margin: '8px 0',
            },
          }}
          elevation={8}
        >
          <BottomNavigation
            value={currentValue}
            sx={{
              height: 70,
              backgroundColor: 'transparent',
              '& .MuiBottomNavigationAction-root': {
                color: '#64748b',
                minWidth: 'auto',
                padding: '6px 12px 10px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  color: '#3b82f6',
                  transform: 'translateY(-2px)',
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  },
                  '& .MuiSvgIcon-root': {
                    transform: 'scale(1.1)',
                  },
                },
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  lineHeight: 1.2,
                  marginTop: '4px',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              },
              '& .MuiSvgIcon-root': {
                fontSize: '1.5rem',
                transition: 'transform 0.2s ease-in-out',
              },
            }}
          >
            {mainNavItems.map((item) => (
              <BottomNavigationAction
                key={item.value}
                label={item.label}
                value={item.value}
                icon={item.icon}
                component={Link}
                to={item.value}
                sx={{
                  '&:hover': {
                    '& .MuiSvgIcon-root': {
                      transform: 'scale(1.05)',
                    },
                  },
                }}
              />
            ))}
            
            {/* More menu button */}
            <BottomNavigationAction
              label="More"
              icon={<MoreVertIcon />}
              onClick={handleMenuClick}
              sx={{
                '&:hover': {
                  '& .MuiSvgIcon-root': {
                    transform: 'scale(1.05)',
                  },
                },
              }}
            />
          </BottomNavigation>
        </Paper>
      </Slide>

      {/* Overflow Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: 200,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            mb: 1,
          },
        }}
      >
        {/* User Info Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              src={userProfilePictureUrl} 
              alt="User"
              sx={{ 
                width: 40, 
                height: 40,
                border: '2px solid #3b82f6',
              }}
            />
            <Box>
              <Typography 
                variant="subtitle2" 
                sx={{ fontWeight: 600, color: '#1f2937' }}
              >
                {userFullName}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#6b7280',
                  textTransform: 'capitalize',
                }}
              >
                {activeMode}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Role Switch Section - only show if user can switch modes */}
        {canSwitchModes && (
          <>
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
              backgroundColor: 'rgba(59, 130, 246, 0.02)'
            }}>
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  handleModeToggle();
                }}
                sx={{
                  borderRadius: '8px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: '#3b82f6',
                    minWidth: '36px !important',
                  }}
                >
                  {activeMode === 'doctor' ? <PersonOutlineIcon /> : <BadgeIcon />}
                </ListItemIcon>
                <ListItemText 
                  primary={`Switch to ${activeMode === 'doctor' ? 'Patient' : 'Doctor'} View`}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#3b82f6',
                    },
                  }}
                />
              </MenuItem>
            </Box>
          </>
        )}

        {/* Menu Items */}
        {menuItems.map((item, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              handleMenuClose();
              if (item.action) {
                item.action();
              }
            }}
            component={item.href ? Link : 'li'}
            to={item.href}
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                '& .MuiListItemIcon-root': {
                  color: '#3b82f6',
                },
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: '#6b7280',
                minWidth: '36px !important',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                },
              }}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <Box sx={{ height: 70 }} />
    </>
  );
};

export default BottomNavbar;

import React, { useContext } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  MenuItem,
  Box,
  Avatar,
  Typography,
  ListItemIcon,
  ListItemText,
  SwipeableDrawer,
  Divider,
  Button,
  Stack,
  Slide,
  useScrollTrigger,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  MoreVert as MoreVertIcon,
  Badge as BadgeIcon,
  PersonOutline as PersonOutlineIcon,
} from '@mui/icons-material';
import { AuthContext } from '../../../features/auth/context/AuthContext';
import { useRoleMode } from '../../../contexts/RoleModeContext';
import { buildNavConfig } from './navConfig';

const BottomNavbar = () => {
  const { t, i18n } = useTranslation('common');
  const { 
    isLoggedIn, 
    logout, 
    userId, 
    userType, 
    assignedDoctorId,
    userFullName, 
    userProfilePictureUrl 
  } = useContext(AuthContext);
  const { activeMode, canSwitchModes, handleModeToggle } = useRoleMode();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isRTL = i18n.language === 'ar';
  
  const [moreOpen, setMoreOpen] = React.useState(false);

  const trigger = useScrollTrigger({
    target: window,
    threshold: 100,
  });

  const handleMenuClick = () => {
    setMoreOpen(true);
  };

  const handleMenuClose = () => {
    setMoreOpen(false);
  };

  const receptionistAssignedDoctorId = assignedDoctorId || localStorage.getItem('assignedDoctorId');
  const isReceptionistAssigned = userType === 'receptionist' && activeMode === 'receptionist' && !!receptionistAssignedDoctorId;

  const tNav = React.useCallback((key) => t(`navigation.${key}`), [t]);

  const nextMode = activeMode === userType ? 'patient' : userType;
  const nextModeLabel = t(`userTypes.${nextMode}`);

  const handleLanguageChange = React.useCallback(async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);

      const direction = languageCode === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.dir = direction;
      document.documentElement.lang = languageCode;
      localStorage.setItem('i18nextLng', languageCode);

      handleMenuClose();
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [i18n, handleMenuClose]);

  const { bottomTabs: mainNavItems, bottomMenuItems: menuItems } = React.useMemo(() => {
    if (!isLoggedIn || !userId || !userType) {
      return {
        bottomTabs: [],
        bottomMenuItems: [],
      };
    }

    return buildNavConfig({
      tNav,
      userId,
      userType,
      activeMode,
      isReceptionistAssigned,
      logout,
    });
  }, [tNav, isLoggedIn, userId, userType, activeMode, isReceptionistAssigned, logout]);

  if (!isMobile || !isLoggedIn) {
    return null;
  }

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
              flexDirection: isRTL ? 'row-reverse' : 'row',
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
              label={t('navigation.more')}
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
      <SwipeableDrawer
        anchor="bottom"
        open={moreOpen}
        onClose={handleMenuClose}
        onOpen={() => setMoreOpen(true)}
        PaperProps={{
          sx: {
            borderRadius: '16px 16px 0 0',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.12)',
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            maxHeight: '85vh',
          },
        }}
      >
        <Box sx={{ pt: 1, pb: 0.5, display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{
              width: 44,
              height: 5,
              borderRadius: 999,
              backgroundColor: 'rgba(0,0,0,0.18)',
            }}
          />
        </Box>

        {/* User Info Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              src={userProfilePictureUrl} 
              alt={t('navigation.profile')}
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
                  textTransform: 'none',
                }}
              >
                {t(`userTypes.${activeMode || userType}`)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, display: 'block', mb: 1 }}>
            {t('navigation.language')}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button
              variant={i18n.language === 'ar' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleLanguageChange('ar')}
              sx={{ borderRadius: 999, textTransform: 'none' }}
            >
              🇲🇦 العربية
            </Button>
            <Button
              variant={i18n.language === 'fr' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleLanguageChange('fr')}
              sx={{ borderRadius: 999, textTransform: 'none' }}
            >
              🇫🇷 Français
            </Button>
            <Button
              variant={i18n.language === 'en' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleLanguageChange('en')}
              sx={{ borderRadius: 999, textTransform: 'none' }}
            >
              🇺🇸 English
            </Button>
          </Stack>
        </Box>

        <Divider />

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
                  {activeMode === userType ? <BadgeIcon /> : <PersonOutlineIcon />}
                </ListItemIcon>
                <ListItemText 
                  primary={t('navigation.switchTo', { mode: nextModeLabel })}
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

        <Box sx={{ height: 16 }} />
      </SwipeableDrawer>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <Box sx={{ height: 70 }} />
    </>
  );
};

export default BottomNavbar;

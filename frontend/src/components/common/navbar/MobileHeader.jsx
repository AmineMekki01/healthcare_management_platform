import React, { useContext } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  useMediaQuery,
  Slide,
  useScrollTrigger,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import {
  ArrowBack as ArrowBackIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../features/auth/context/AuthContext';
import { useRoleMode } from '../../../contexts/RoleModeContext';
import { getMobilePageTitle, shouldShowBackButton } from '../../../hooks/useMobileNavigation';
import { getProfileHrefForMode } from './navConfig';

const MobileHeader = ({ title, showBackButton, actions = [] }) => {
  const { t } = useTranslation('common');
  const { userProfilePictureUrl, userId, userType } = useContext(AuthContext);
  const { activeMode } = useRoleMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const shouldShowBack = showBackButton !== undefined 
    ? showBackButton 
    : shouldShowBackButton(location.pathname);
  const trigger = useScrollTrigger({
    target: window,
    threshold: 100,
  });

  if (!isMobile) {
    return null;
  }

  const pageTitle = title || getMobilePageTitle(location.pathname, activeMode, t);

  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleProfileClick = () => {
    navigate(getProfileHrefForMode(userType, userId));
  };

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          color: '#1f2937',
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Toolbar
          sx={{
            minHeight: '64px !important',
            paddingX: 2,
            justifyContent: 'space-between',
          }}
        >
          {/* Left section */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {shouldShowBack && (
              <IconButton
                onClick={handleBackClick}
                sx={{
                  mr: 1,
                  color: '#374151',
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: '1.125rem',
                color: '#1f2937',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {pageTitle}
            </Typography>
          </Box>

          {/* Right section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {actions.map((action, index) => (
              <IconButton
                key={index}
                onClick={action.onClick}
                sx={{
                  color: '#374151',
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                  },
                }}
              >
                {action.icon}
              </IconButton>
            ))}

            {/* Notifications */}
            <IconButton
              sx={{
                color: '#374151',
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                },
              }}
            >
              <NotificationsIcon />
            </IconButton>

            {/* Profile Avatar */}
            <Avatar
              src={userProfilePictureUrl}
              sx={{
                width: 32,
                height: 32,
                border: '2px solid #e5e7eb',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: '#3b82f6',
                },
                transition: 'border-color 0.2s ease-in-out',
              }}
              onClick={handleProfileClick}
              alt={t('navigation.profile')}
            />
          </Box>
        </Toolbar>
      </AppBar>
    </Slide>
  );
};

export default MobileHeader;

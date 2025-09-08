import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Menu as MenuIcon } from '@mui/icons-material';
import logo from '../../../assets/images/logo_doc_app_white.png';
import FlagLanguageSelector from '../LanguageSelector/FlagLanguageSelector';

const PublicNavbar = () => {
  const { t, i18n } = useTranslation('common');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const isRTL = i18n.language === 'ar';

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const navItems = [
    { label: t('navigation.home'), path: '/' },
    { label: t('navigation.login'), path: '/login' },
    { label: t('navigation.register'), path: '/register' },
  ];

  return (
    <AppBar
      position="static"
      sx={{
        background: 'linear-gradient(145deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%)',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
      }}
    >
      <Toolbar sx={{ direction: isRTL ? 'rtl' : 'ltr' }}>
        {/* Logo - Always on the left in LTR, right in RTL */}
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: isRTL ? 'flex-end' : 'flex-start'
        }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <img
              src={logo}
              alt="Healthcare Platform"
              style={{
                height: '40px',
                filter: 'brightness(0) invert(1)',
                marginRight: isRTL ? '0' : '16px',
                marginLeft: isRTL ? '16px' : '0',
              }}
            />
          </Link>
          <Typography
            variant="h6"
            component="div"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            {t('navigation.platformName')}
          </Typography>
        </Box>

        {/* Navigation Items */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          order: isRTL ? -1 : 0
        }}>
          {/* Language Selector */}
          <FlagLanguageSelector />
          
          {isMobile ? (
            <Box>
              <IconButton
                size="large"
                aria-label="menu"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: isRTL ? 'left' : 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: isRTL ? 'left' : 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                {navItems.map((item) => (
                  <MenuItem key={item.label} onClick={handleClose}>
                    <Link
                      to={item.path}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        width: '100%',
                      }}
                    >
                      {item.label}
                    </Link>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              flexDirection: isRTL ? 'row-reverse' : 'row'
            }}>
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  color="inherit"
                  component={Link}
                  to={item.path}
                  sx={{
                    color: 'white',
                    fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                    backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                    borderRadius: '8px',
                    px: 3,
                    py: 1,
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default PublicNavbar;

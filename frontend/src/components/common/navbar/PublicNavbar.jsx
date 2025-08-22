import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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

const PublicNavbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Login', path: '/login' },
    { label: 'Register', path: '/register' },
  ];

  return (
    <AppBar
      position="static"
      sx={{
        background: 'linear-gradient(145deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%)',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
      }}
    >
      <Toolbar>
        {/* Logo */}
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <img
              src={logo}
              alt="Healthcare Platform"
              style={{
                height: '40px',
                filter: 'brightness(0) invert(1)',
                marginRight: '16px',
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
            Healthcare Platform
          </Typography>
        </Box>

        {/* Navigation Items */}
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
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
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
          // Desktop Menu
          <Box sx={{ display: 'flex', gap: 2 }}>
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
      </Toolbar>
    </AppBar>
  );
};

export default PublicNavbar;

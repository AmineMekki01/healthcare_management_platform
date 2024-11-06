import React, { useContext } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Avatar,
  ListItemIcon,
  Divider,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Box,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Description as DescriptionIcon,
  Chat as ChatIcon,
  Feed as FeedIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  PostAdd as PostAddIcon,
  Article as ArticleIcon,
  ChatBubble as ChatBubbleIcon,
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { AuthContext } from './../../Auth/AuthContext';
import logo from '../../../assets/images/logo_doc_app_white.png';

function capitalizeWords(str) {
  if (!str) return '';
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

const MyNavbar = () => {
  const {
    isLoggedIn,
    logout,
    userId,
    userType,
    userFullName,
    userProfilePhotoUrl,
  } = useContext(AuthContext);
  const location = useLocation();

  const profileHref =
    userType === 'doctor'
      ? `/DoctorProfile/${userId}`
      : `/PatientProfile/${userId}`;

  // Posts Menu state for Desktop
  const [postsMenuAnchorEl, setPostsMenuAnchorEl] = React.useState(null);
  const handlePostsMenuClick = (event) => {
    setPostsMenuAnchorEl(event.currentTarget);
  };
  const handlePostsMenuClose = () => {
    setPostsMenuAnchorEl(null);
  };

  // Documents Menu state for Desktop
  const [documentsMenuAnchorEl, setDocumentsMenuAnchorEl] = React.useState(null);
  const handleDocumentsMenuClick = (event) => {
    setDocumentsMenuAnchorEl(event.currentTarget);
  };
  const handleDocumentsMenuClose = () => {
    setDocumentsMenuAnchorEl(null);
  };

  // Profile Menu state for Desktop
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = React.useState(null);
  const handleProfileMenuClick = (event) => {
    setProfileMenuAnchorEl(event.currentTarget);
  };
  const handleProfileMenuClose = () => {
    setProfileMenuAnchorEl(null);
  };

  // Drawer state for Mobile
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Expandable lists in the Drawer state
  const [drawerPostsOpen, setDrawerPostsOpen] = React.useState(false);
  const handleDrawerPostsClick = () => {
    setDrawerPostsOpen(!drawerPostsOpen);
  };

  const [drawerDocumentsOpen, setDrawerDocumentsOpen] = React.useState(false);
  const handleDrawerDocumentsClick = () => {
    setDrawerDocumentsOpen(!drawerDocumentsOpen);
  };

  // Nav items
  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: <HomeIcon />,
    },
    {
      label: 'Posts',
      icon: <FeedIcon />,
      hasSubItems: true,
      subItems: [
        { label: 'Feed', href: '/feed', icon: <FeedIcon /> },
        ...(userType === 'doctor'
          ? [
              { label: 'Create Post', href: '/create-post', icon: <PostAddIcon /> },
              { label: 'My Posts', href: '/doctor-posts', icon: <ArticleIcon /> },
            ]
          : []),
      ],
    },
    {
      label: 'Appointments',
      href: '/patient-appointments',
      icon: <EventIcon />,
    },
    {
      label: 'Documents',
      icon: <DescriptionIcon />,
      hasSubItems: true,
      subItems: [
        { label: 'MyDocs', href: '/MyDocs', icon: <DescriptionIcon /> },
        ...(userType === 'doctor'
          ? [
              {
                label: 'My Reports',
                href: `/medical-report/${userId}`,
                icon: <DescriptionIcon />,
              },
            ]
          : []),
      ],
    },
    {
      label: 'Messages',
      href: '/Messages',
      icon: <ChatIcon />,
    },
    ...(userType === 'doctor'
      ? [
          {
            label: 'ChatBot',
            href: '/ChatBot',
            icon: <ChatBubbleIcon />,
          },
        ]
      : []),
    {
      label: 'Search',
      href: '/SearchBar',
      icon: <SearchIcon />,
    },
  ];

  // The drawer
  const drawer = (
    <Box
      sx={{ width: 250, display: 'flex', flexDirection: 'column', height: '100%' }}
      role="presentation"
    >
      {/* Logo */}
      <Box>
        <Toolbar>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            <img src={logo} alt="Logo" style={{ height: '40px' }} />
          </Link>
        </Toolbar>
        <Divider />
        {/* Nav Items */}
        <List>
          {navItems.map((item, index) =>
            item.hasSubItems ? (
              <React.Fragment key={index}>
                <ListItem button onClick={
                  item.label === 'Posts'
                    ? handleDrawerPostsClick
                    : handleDrawerDocumentsClick
                }>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                  {item.label === 'Posts' ? (drawerPostsOpen ? <ExpandLess /> : <ExpandMore />) : (drawerDocumentsOpen ? <ExpandLess /> : <ExpandMore />)}
                </ListItem>
                <Collapse in={item.label === 'Posts' ? drawerPostsOpen : drawerDocumentsOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem, subIndex) => (
                      <ListItem
                        button
                        key={subIndex}
                        component={Link}
                        to={subItem.href}
                        selected={location.pathname === subItem.href}
                        onClick={() => setMobileOpen(false)}
                        sx={{ pl: 4 }}
                      >
                        <ListItemIcon>{subItem.icon}</ListItemIcon>
                        <ListItemText primary={subItem.label} />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            ) : (
              <ListItem
                button
                key={index}
                component={Link}
                to={item.href}
                selected={location.pathname === item.href}
                onClick={() => setMobileOpen(false)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            )
          )}
        </List>
      </Box>

      {/* Profile Section */}
      {isLoggedIn && (
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Divider />
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <IconButton component={Link} to={profileHref} sx={{ p: 0 }}>
              <Avatar src={userProfilePhotoUrl} alt="User" />
            </IconButton>
            <Typography variant="subtitle1" component={Link} to={profileHref} sx={{ ml: 1, textDecoration: 'none', color: 'inherit' }}>
              {userFullName}
            </Typography>
          </Box>
          <List>
            <ListItem
              button
              component={Link}
              to={`/settings/${userId}`}
              selected={location.pathname === `/settings/${userId}`}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
            <ListItem
              button
              onClick={() => {
                logout();
                setMobileOpen(false);
              }}
              component={Link}
              to="/login"
            >
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {/* Mobile Menu Icon */}
          {isMobile && isLoggedIn && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              <img src={logo} alt="Logo" style={{ height: '40px' }} />
            </Link>
          </Box>

          {/* Desktop Nav Buttons and Profile Avatar */}
          {isLoggedIn && (
            <>
              {!isMobile && (
                <>
                  {navItems.map((item, index) =>
                    item.hasSubItems ? (
                      <React.Fragment key={index}>
                        <Button
                          color="inherit"
                          startIcon={item.icon}
                          onClick={
                            item.label === 'Posts'
                              ? handlePostsMenuClick
                              : handleDocumentsMenuClick
                          }
                          aria-controls={
                            item.label === 'Posts'
                              ? 'posts-menu'
                              : 'documents-menu'
                          }
                          aria-haspopup="true"
                        >
                          {item.label}
                        </Button>
                        <Menu
                          id={
                            item.label === 'Posts'
                              ? 'posts-menu'
                              : 'documents-menu'
                          }
                          anchorEl={
                            item.label === 'Posts'
                              ? postsMenuAnchorEl
                              : documentsMenuAnchorEl
                          }
                          open={
                            item.label === 'Posts'
                              ? Boolean(postsMenuAnchorEl)
                              : Boolean(documentsMenuAnchorEl)
                          }
                          onClose={
                            item.label === 'Posts'
                              ? handlePostsMenuClose
                              : handleDocumentsMenuClose
                          }
                          MenuListProps={{
                            'aria-labelledby': 'basic-button',
                          }}
                        >
                          {item.subItems.map((subItem, subIndex) => (
                            <MenuItem
                              key={subIndex}
                              onClick={
                                item.label === 'Posts'
                                  ? handlePostsMenuClose
                                  : handleDocumentsMenuClose
                              }
                              component={Link}
                              to={subItem.href}
                              selected={location.pathname === subItem.href}
                            >
                              <ListItemIcon>{subItem.icon}</ListItemIcon>
                              {subItem.label}
                            </MenuItem>
                          ))}
                        </Menu>
                      </React.Fragment>
                    ) : (
                      <Button
                        color="inherit"
                        startIcon={item.icon}
                        component={Link}
                        to={item.href}
                        key={index}
                        sx={{
                          backgroundColor:
                            location.pathname === item.href
                              ? 'rgba(255, 255, 255, 0.2)'
                              : 'inherit',
                        }}
                      >
                        {item.label}
                      </Button>
                    )
                  )}
                  <IconButton color="inherit" onClick={handleProfileMenuClick}>
                <Avatar src={userProfilePhotoUrl} alt="User" />
              </IconButton>
                </>
              )}

              {/* Profile Avatar */}
              
              <Menu
                anchorEl={profileMenuAnchorEl}
                open={Boolean(profileMenuAnchorEl)}
                onClose={handleProfileMenuClose}
                MenuListProps={{
                  'aria-labelledby': 'profile-button',
                }}
              >
                <MenuItem
                  onClick={handleProfileMenuClose}
                  component={Link}
                  to={profileHref}
                  selected={location.pathname === profileHref}
                >
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem
                  onClick={handleProfileMenuClose}
                  component={Link}
                  to={`/settings/${userId}`}
                  selected={location.pathname === `/settings/${userId}`}
                >
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={() => {
                    logout();
                    handleProfileMenuClose();
                  }}
                  component={Link}
                  to="/login"
                >
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          )}

          {/* Auth Buttons */}
          {!isLoggedIn && (
            <>
              <Button
                color="inherit"
                component={Link}
                to="/login"
                sx={{
                  backgroundColor:
                    location.pathname === '/login'
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'inherit',
                }}
              >
                Login
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/register"
                sx={{
                  backgroundColor:
                    location.pathname === '/register'
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'inherit',
                }}
              >
                Register
              </Button>
            </>
          )}
        </Toolbar>

        {/* Making the drawer responsive */}
        {isLoggedIn && (
          <nav>
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true,
              }}
              sx={{
                display: { xs: 'block', md: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
              }}
            >
              {drawer}
            </Drawer>
          </nav>
        )}
      </AppBar>
    </>
  );
};

export default MyNavbar;

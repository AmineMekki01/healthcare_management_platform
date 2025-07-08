import React, { useContext } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Box,
  Avatar,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  useMediaQuery,
  Paper,
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
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { AuthContext } from './../../Auth/AuthContext';
import { useSidebar } from '../../../contexts/SidebarContext';
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
  
  const { sidebarOpen, handleSidebarToggle } = useSidebar();
  const location = useLocation();

  const profileHref =
    userType === 'doctor'
      ? `/DoctorProfile/${userId}`
      : `/PatientProfile/${userId}`;

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [hovering, setHovering] = React.useState(false);

  // Expandable tabs state
  const [postsOpen, setPostsOpen] = React.useState(false);
  const [documentsOpen, setDocumentsOpen] = React.useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Resetting mobile drawer when switching to desktop
  React.useEffect(() => {
    if (!isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isMobile, mobileOpen]);

  // Mobile drawer toggle
  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Handle tabs list expansions
  const handlePostsClick = () => {
    setPostsOpen(!postsOpen);
  };

  const handleDocumentsClick = () => {
    setDocumentsOpen(!documentsOpen);
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

  const drawerWidth = sidebarOpen ? 280 : 72;

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      {isMobile && !mobileOpen && (
        <IconButton
          onClick={handleMobileToggle}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: theme.zIndex.drawer + 2,
            background: 'linear-gradient(145deg, #3b82f6, #6366f1)',
            color: 'white',
            width: 56,
            height: 56,
            '&:hover': {
              background: 'linear-gradient(145deg, #2563eb, #5b21b6)',
              transform: 'scale(1.05)',
            },
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? mobileOpen : true}
      onClose={() => setMobileOpen(false)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(145deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%)',
          color: 'white',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          position: 'fixed',
          height: '100vh',
          top: 0,
          left: 0,
          zIndex: theme.zIndex.drawer,
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255,255,255,0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '3px',
            '&:hover': {
              background: 'rgba(255,255,255,0.3)',
            },
          },
        },
      }}
    >
      {/* Header with Logo and Toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          padding: '16px',
          minHeight: '64px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        {sidebarOpen && (
          <Link to="/" style={{ textDecoration: 'none' }}>
            <img 
              src={logo} 
              alt="Logo" 
              style={{ 
                height: '40px',
                filter: 'brightness(0) invert(1)',
              }} 
            />
          </Link>
        )}
        {!isMobile && (
          <IconButton
            onClick={handleSidebarToggle}
            sx={{ 
              color: 'white',
              '&:hover': { 
                backgroundColor: 'rgba(255,255,255,0.08)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        )}
      </Box>

      {/* User Profile Section */}
      <Box
        sx={{
          padding: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Avatar 
          src={userProfilePhotoUrl} 
          alt="User"
          sx={{ 
            width: 48, 
            height: 48,
            border: '2px solid rgba(255,255,255,0.2)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
        {sidebarOpen && (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {capitalizeWords(userFullName)}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.8,
                textTransform: 'capitalize',
              }}
            >
              {userType}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Navigation Items */}
      <List sx={{ flex: 1, padding: '8px' }}>
        {navItems.map((item, index) => (
          <React.Fragment key={index}>
            {item.hasSubItems ? (
              <>
                {sidebarOpen ? (
                  // Expanded sidebar -> we show normal expandable menu
                  <>
                    <ListItem
                      button
                      onClick={item.label === 'Posts' ? handlePostsClick : handleDocumentsClick}
                      sx={{
                        borderRadius: '12px',
                        margin: '4px 0',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          transform: 'translateX(4px)',
                        },
                        padding: '12px 16px',
                        justifyContent: 'initial',
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <ListItemIcon 
                        sx={{ 
                          color: 'white',
                          minWidth: '40px',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.label}
                        sx={{ 
                          '& .MuiListItemText-primary': {
                            fontWeight: 500,
                          }
                        }}
                      />
                      {item.label === 'Posts' ? 
                        (postsOpen ? <ExpandLess /> : <ExpandMore />) : 
                        (documentsOpen ? <ExpandLess /> : <ExpandMore />)
                      }
                    </ListItem>
                    
                    <Collapse 
                      in={item.label === 'Posts' ? postsOpen : documentsOpen} 
                      timeout="auto" 
                      unmountOnExit
                    >
                      <List component="div" disablePadding>
                        {item.subItems.map((subItem, subIndex) => (
                          <ListItem
                            button
                            key={subIndex}
                            component={Link}
                            to={subItem.href}
                            onClick={() => isMobile && setMobileOpen(false)}
                            sx={{
                              borderRadius: '8px',
                              margin: '2px 0',
                              marginLeft: '20px',
                              padding: '8px 16px',
                              backgroundColor: location.pathname === subItem.href 
                                ? 'rgba(255,255,255,0.15)' 
                                : 'transparent',
                              '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                transform: 'translateX(4px)',
                              },
                              transition: 'all 0.2s ease-in-out',
                            }}
                          >
                            <ListItemIcon 
                              sx={{ 
                                color: 'white',
                                minWidth: '40px',
                              }}
                            >
                              {subItem.icon}
                            </ListItemIcon>
                            <ListItemText 
                              primary={subItem.label}
                              sx={{ 
                                '& .MuiListItemText-primary': {
                                  fontSize: '0.9rem',
                                  fontWeight: location.pathname === subItem.href ? 600 : 400,
                                }
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </>
                ) : (
                  // Collapsed sidebar -> we show tooltip with sub-menu items
                  <Tooltip 
                    title={
                      <Box sx={{ p: 1 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 700, 
                            mb: 2,
                            fontSize: '0.95rem',
                            color: '#f1f5f9',
                            borderBottom: '1px solid rgba(241,245,249,0.2)',
                            paddingBottom: '8px',
                          }}
                        >
                          {item.label}
                        </Typography>
                        {item.subItems.map((subItem, subIndex) => (
                          <Box
                            key={subIndex}
                            component={Link}
                            to={subItem.href}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px 12px',
                              color: '#f1f5f9',
                              textDecoration: 'none',
                              borderRadius: '6px',
                              margin: '2px 0',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                backgroundColor: 'rgba(59, 130, 246, 0.3)',
                                transform: 'translateX(4px)',
                              }
                            }}
                          >
                            <Box sx={{ 
                              mr: 2, 
                              display: 'flex',
                              fontSize: '1.1rem',
                              opacity: 0.9,
                            }}>
                              {subItem.icon}
                            </Box>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                              {subItem.label}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    }
                    placement="right"
                    arrow
                    componentsProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: 'linear-gradient(145deg, #1e293b 0%, #334155 100%)',
                          background: 'linear-gradient(145deg, #1e293b 0%, #334155 100%)',
                          fontSize: '0.875rem',
                          maxWidth: 280,
                          padding: 0,
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                        },
                      },
                      arrow: {
                        sx: {
                          color: '#1e293b',
                          '&::before': {
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: '#1e293b',
                          }
                        }
                      }
                    }}
                  >
                    <ListItem
                      button
                      sx={{
                        borderRadius: '12px',
                        margin: '4px 0',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          transform: 'scale(1.05)',
                        },
                        padding: '12px',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <ListItemIcon 
                        sx={{ 
                          color: 'white',
                          minWidth: 'auto',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                    </ListItem>
                  </Tooltip>
                )}
              </>
            ) : (
              <Tooltip 
                title={!sidebarOpen ? item.label : ''} 
                placement="right"
                arrow
              >
                <ListItem
                  button
                  component={Link}
                  to={item.href}
                  onClick={() => isMobile && setMobileOpen(false)}
                  sx={{
                    borderRadius: '12px',
                    margin: '4px 0',
                    backgroundColor: location.pathname === item.href 
                      ? 'rgba(59, 130, 246, 0.2)' 
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: location.pathname === item.href 
                        ? 'rgba(59, 130, 246, 0.3)' 
                        : 'rgba(255,255,255,0.08)',
                      transform: 'translateX(4px)',
                    },
                    padding: sidebarOpen ? '12px 16px' : '12px',
                    justifyContent: sidebarOpen ? 'initial' : 'center',
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: 'white',
                      minWidth: sidebarOpen ? '40px' : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {sidebarOpen && (
                    <ListItemText 
                      primary={item.label}
                      sx={{ 
                        '& .MuiListItemText-primary': {
                          fontWeight: location.pathname === item.href ? 600 : 500,
                        }
                      }}
                    />
                  )}
                </ListItem>
              </Tooltip>
            )}
          </React.Fragment>
        ))}
      </List>

      {/* Bottom Actions */}
      <Box sx={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
        <Tooltip 
          title={!sidebarOpen ? 'Profile' : ''} 
          placement="right"
          arrow
        >
          <ListItem
            button
            component={Link}
            to={profileHref}
            onClick={() => isMobile && setMobileOpen(false)}
            sx={{
              borderRadius: '12px',
              margin: '4px 0',
              backgroundColor: location.pathname === profileHref 
                ? 'rgba(59, 130, 246, 0.2)' 
                : 'transparent',
              '&:hover': {
                backgroundColor: location.pathname === profileHref 
                  ? 'rgba(59, 130, 246, 0.3)' 
                  : 'rgba(255,255,255,0.08)',
                transform: 'translateX(4px)',
              },
              padding: sidebarOpen ? '12px 16px' : '12px',
              justifyContent: sidebarOpen ? 'initial' : 'center',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: 'white',
                minWidth: sidebarOpen ? '40px' : 'auto',
                justifyContent: 'center',
              }}
            >
              <PersonIcon />
            </ListItemIcon>
            {sidebarOpen && (
              <ListItemText 
                primary="Profile"
                sx={{ 
                  '& .MuiListItemText-primary': {
                    fontWeight: 500,
                  }
                }}
              />
            )}
          </ListItem>
        </Tooltip>

        <Tooltip 
          title={!sidebarOpen ? 'Settings' : ''} 
          placement="right"
          arrow
        >
          <ListItem
            button
            component={Link}
            to={`/settings/${userId}`}
            onClick={() => isMobile && setMobileOpen(false)}
            sx={{
              borderRadius: '12px',
              margin: '4px 0',
              backgroundColor: location.pathname === `/settings/${userId}` 
                ? 'rgba(59, 130, 246, 0.2)' 
                : 'transparent',
              '&:hover': {
                backgroundColor: location.pathname === `/settings/${userId}` 
                  ? 'rgba(59, 130, 246, 0.3)' 
                  : 'rgba(255,255,255,0.08)',
                transform: 'translateX(4px)',
              },
              padding: sidebarOpen ? '12px 16px' : '12px',
              justifyContent: sidebarOpen ? 'initial' : 'center',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: 'white',
                minWidth: sidebarOpen ? '40px' : 'auto',
                justifyContent: 'center',
              }}
            >
              <SettingsIcon />
            </ListItemIcon>
            {sidebarOpen && (
              <ListItemText 
                primary="Settings"
                sx={{ 
                  '& .MuiListItemText-primary': {
                    fontWeight: 500,
                  }
                }}
              />
            )}
          </ListItem>
        </Tooltip>

        <Tooltip 
          title={!sidebarOpen ? 'Logout' : ''} 
          placement="right"
          arrow
        >
          <ListItem
            button
            onClick={() => {
              logout();
              isMobile && setMobileOpen(false);
            }}
            component={Link}
            to="/login"
            sx={{
              borderRadius: '12px',
              margin: '4px 0',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                transform: 'translateX(4px)',
              },
              padding: sidebarOpen ? '12px 16px' : '12px',
              justifyContent: sidebarOpen ? 'initial' : 'center',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: 'white',
                minWidth: sidebarOpen ? '40px' : 'auto',
                justifyContent: 'center',
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            {sidebarOpen && (
              <ListItemText 
                primary="Logout"
                sx={{ 
                  '& .MuiListItemText-primary': {
                    fontWeight: 500,
                  }
                }}
              />
            )}
          </ListItem>
        </Tooltip>
      </Box>
    </Drawer>
    </>
  );
};

export default MyNavbar;

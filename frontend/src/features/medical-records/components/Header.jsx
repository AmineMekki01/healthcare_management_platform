import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper,
  Container
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  FolderShared as FolderSharedIcon,
  Share as ShareIcon,
  Description as DescriptionIcon,
  LocalHospital as MedicalIcon
} from '@mui/icons-material';
import { AuthContext } from '../../auth/context/AuthContext';

function FileUploadHeader() {
  const { userType } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const getCurrentTab = () => {
    const path = location.pathname.split('/');
    const tab = path[path.length - 1];
    return ['my-docs', 'medical-records', 'upload', 'shared-with-me', 'i-shared-with'].includes(tab) 
      ? tab 
      : 'my-docs';
  };

  const activeView = getCurrentTab();
  
  const getActiveTab = () => {
    if (activeView === 'medical-records') return 1;
    if (activeView === 'upload') return 2;
    if (activeView === 'shared-with-me') return 3;
    if (activeView === 'i-shared-with') return 4;
    return 0;
  };

  const getVisibleTabs = () => {
    const baseTabs = [
      {
        icon: <CloudUploadIcon sx={{ mb: 1 }} />,
        label: "My Docs",
        onClick: () => navigate('/records'),
        description: "Personal documents (not used by Chatbot)"
      },
      {
        icon: <MedicalIcon sx={{ mb: 1 }} />,
        label: "Medical Records",
        onClick: () => navigate('medical-records'),
        description: "Clinical documents organized by category"
      },
    ];

    if (userType === 'doctor' || userType === 'receptionist') {
      baseTabs.push(
        {
          icon: <ShareIcon sx={{ mb: 1 }} />,
          label: "Upload & Share",
          onClick: () => navigate('upload'),
          description: "Upload files and share with patients"
        },
        {
          icon: <FolderSharedIcon sx={{ mb: 1 }} />,
          label: "Shared with Me",
          onClick: () => navigate('shared-with-me'),
          description: "Documents shared by colleagues"
        },
        {
          icon: <ShareIcon sx={{ mb: 1 }} />,
          label: "I Shared With",
          onClick: () => navigate('i-shared-with'),
          description: "Documents I've shared with others"
        }
      );
    }

    return baseTabs;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box mb={3}>
        <Box 
          display="flex" 
          alignItems="center" 
          mb={2}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            p: 3,
            color: 'white',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
          }}
        >
          <DescriptionIcon sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                mb: 0.5,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              Medical Documents
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                opacity: 0.9,
                fontWeight: 400 
              }}
            >
              Manage, share, and organize your medical files
            </Typography>
          </Box>
        </Box>
      </Box>

      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: '20px',
          background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
          border: '1px solid rgba(102, 126, 234, 0.1)',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={getActiveTab()}
          variant="fullWidth"
          sx={{
            '& .MuiTabs-indicator': {
              background: 'linear-gradient(90deg, #667eea, #764ba2)',
              height: '3px',
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              py: 3,
              transition: 'all 0.3s ease',
              color: '#64748b',
              '&:hover': {
                color: '#667eea',
                transform: 'translateY(-2px)',
              },
              '&.Mui-selected': {
                color: '#667eea',
                fontWeight: 700,
              }
            }
          }}
        >
          {getVisibleTabs().map((tab, index) => (
            <Tab 
              key={index}
              icon={tab.icon}
              label={tab.label} 
              onClick={tab.onClick}
              iconPosition="top"
              title={tab.description}
              component="div"
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Tabs>

      </Paper>
    </Container>
  );
}

export default FileUploadHeader;
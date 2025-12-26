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
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../auth/context/AuthContext';

function FileUploadHeader() {
  const { userType, assignedDoctorId } = useContext(AuthContext);
  const { t } = useTranslation('medical');
  const navigate = useNavigate();
  const location = useLocation();

  const receptionistAssignedDoctorId = assignedDoctorId || localStorage.getItem('assignedDoctorId');
  const canUploadShare = userType === 'doctor' || (userType === 'receptionist' && !!receptionistAssignedDoctorId);
  
  const getCurrentTab = () => {
    const path = location.pathname.split('/');
    const tab = path[path.length - 1];
    return ['my-docs', 'medical-records', 'upload', 'shared-with-me', 'i-shared-with'].includes(tab) 
      ? tab 
      : 'my-docs';
  };

  const activeView = getCurrentTab();
  
  const getVisibleTabs = () => {
    const baseTabs = [
      {
        icon: <CloudUploadIcon sx={{ mb: 1 }} />,
        label: t('header.tabs.myDocs'),
        onClick: () => navigate('/records'),
        description: t('header.tabs.myDocsDescription'),
        value: 'my-docs'
      },
      {
        icon: <MedicalIcon sx={{ mb: 1 }} />,
        label: t('header.tabs.medicalRecords'),
        onClick: () => navigate('medical-records'),
        description: t('header.tabs.medicalRecordsDescription'),
        value: 'medical-records'
      },
    ];

    if (canUploadShare) {
      baseTabs.push(
        {
          icon: <ShareIcon sx={{ mb: 1 }} />,
          label: t('header.tabs.uploadShare'),
          onClick: () => navigate('upload'),
          description: t('header.tabs.uploadShareDescription'),
          value: 'upload'
        },
        {
          icon: <FolderSharedIcon sx={{ mb: 1 }} />,
          label: t('header.tabs.sharedWithMe'),
          onClick: () => navigate('shared-with-me'),
          description: t('header.tabs.sharedWithMeDescription'),
          value: 'shared-with-me'
        }
      );
    }

    if (userType === 'doctor' || userType === 'receptionist' || userType === 'patient') {
      baseTabs.push(
        {
          icon: <ShareIcon sx={{ mb: 1 }} />,
          label: t('header.tabs.iSharedWith'),
          onClick: () => navigate('i-shared-with'),
          description: t('header.tabs.iSharedWithDescription'),
          value: 'i-shared-with'
        }
      );
    }

    return baseTabs;
  };

  const getActiveTab = () => {
    const tabs = getVisibleTabs();
    const activeIndex = tabs.findIndex(tab => tab.value === activeView);
    return activeIndex >= 0 ? activeIndex : 0;
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
              {t('header.title')}
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                opacity: 0.9,
                fontWeight: 400 
              }}
            >
              {t('header.subtitle')}
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
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
} from '@mui/icons-material';

function FileUploadHeader() {
  const location = useLocation();
  
  // Determine active tab based on current path
  const getActiveTab = () => {
    if (location.pathname.includes('/Upload')) return 0;
    if (location.pathname.includes('/SharedWithMe')) return 1;
    if (location.pathname.includes('/ISharedWith')) return 2;
    return 0;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header Section */}
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

      {/* Navigation Tabs */}
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
          <Tab 
            icon={<CloudUploadIcon sx={{ mb: 1 }} />}
            label="My Uploads" 
            component={Link} 
            to="/MyDocs/Upload"
            iconPosition="top"
          />
          <Tab 
            icon={<FolderSharedIcon sx={{ mb: 1 }} />}
            label="Shared with Me" 
            component={Link} 
            to="/MyDocs/SharedWithMe"
            iconPosition="top"
          />
          <Tab 
            icon={<ShareIcon sx={{ mb: 1 }} />}
            label="I Shared With" 
            component={Link} 
            to="/MyDocs/ISharedWith"
            iconPosition="top"
          />
        </Tabs>
      </Paper>
    </Container>
  );
}

export default FileUploadHeader;
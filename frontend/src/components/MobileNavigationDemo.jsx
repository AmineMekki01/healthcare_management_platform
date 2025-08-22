import React from 'react';
import { Box, Typography, Card, CardContent, Button, Grid } from '@mui/material';
import { 
  Phone as PhoneIcon, 
  Tablet as TabletIcon, 
  Computer as ComputerIcon 
} from '@mui/icons-material';

const MobileNavigationDemo = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📱 Mobile Navigation Demo
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4, color: '#666' }}>
        The navigation has been optimized for mobile devices! Here's what's new:
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PhoneIcon sx={{ mr: 2, color: '#3b82f6' }} />
                <Typography variant="h6">Bottom Navigation</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                On mobile devices, the main navigation is now at the bottom of the screen, 
                similar to popular mobile apps like Instagram, Twitter, and WhatsApp.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TabletIcon sx={{ mr: 2, color: '#10b981' }} />
                <Typography variant="h6">Mobile Header</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                A clean mobile header shows the current page title, back button (when needed), 
                and quick access to notifications and profile.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ComputerIcon sx={{ mr: 2, color: '#8b5cf6' }} />
                <Typography variant="h6">Desktop Sidebar</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                On desktop, the original sidebar navigation remains unchanged, 
                providing the full feature set for professional use.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, p: 3, backgroundColor: '#f8fafc', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          🔄 Responsive Behavior
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          The navigation automatically adapts based on screen size:
        </Typography>
        <ul style={{ paddingLeft: '20px', margin: 0 }}>
          <li><strong>Mobile (≤ 768px):</strong> Bottom navigation + mobile header</li>
          <li><strong>Desktop (&gt; 768px):</strong> Traditional sidebar navigation</li>
        </ul>
      </Box>

      <Box sx={{ mt: 4, p: 3, backgroundColor: '#ecfdf5', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom color="#065f46">
          ✨ Enhanced Features
        </Typography>
        <ul style={{ paddingLeft: '20px', margin: 0, color: '#047857' }}>
          <li>Auto-hiding navigation on scroll (shows on scroll up)</li>
          <li>Role-based navigation items (different for doctors, patients, receptionists)</li>
          <li>Smooth animations and modern mobile gestures</li>
          <li>Overflow menu for additional options</li>
          <li>Contextual back button based on navigation flow</li>
        </ul>
      </Box>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          Try resizing your browser window or using your phone to see the navigation in action! 📱✨
        </Typography>
      </Box>
    </Box>
  );
};

export default MobileNavigationDemo;

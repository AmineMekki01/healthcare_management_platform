import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocalHospital as LocalHospitalIcon,
  Event as EventIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

export default function ReportCard({ 
  report, 
  onView, 
  onEdit, 
  onDelete, 
  deleteLoading = false 
}) {
  const { t } = useTranslation('reports');
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: '20px',
        background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
        border: '1px solid rgba(102, 126, 234, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(102, 126, 234, 0.15)',
          '&::before': {
            opacity: 1,
          }
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #667eea, #764ba2)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        }
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Patient Info */}
        <Box display="flex" alignItems="center" mb={2}>
          <Box
            sx={{
              p: 1,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              mr: 2,
            }}
          >
            <PersonIcon />
          </Box>
          <Box flexGrow={1}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: '#2d3748',
                mb: 0.5
              }}
            >
              {report.patientFirstName} {report.patientLastName}
            </Typography>
            <Chip 
              label={t('labels.patient')}
              size="small"
              sx={{
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                color: '#667eea',
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>

        {/* Diagnosis */}
        <Box display="flex" alignItems="start" mb={2}>
          <Box
            sx={{
              p: 1,
              borderRadius: '12px',
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              color: '#f43f5e',
              mr: 2,
            }}
          >
            <LocalHospitalIcon />
          </Box>
          <Box flexGrow={1}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#64748b',
                fontWeight: 600,
                mb: 0.5
              }}
            >
              {t('labels.diagnosis')}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#2d3748',
                fontWeight: 500
              }}
            >
              {report.diagnosisName}
            </Typography>
          </Box>
        </Box>

        {/* Referral Doctor */}
        {report.referralDoctorName && (
          <Box display="flex" alignItems="start" mb={2}>
            <Box
              sx={{
                p: 1,
                borderRadius: '12px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                color: '#22c55e',
                mr: 2,
              }}
            >
              <PersonIcon />
            </Box>
            <Box flexGrow={1}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#64748b',
                  fontWeight: 600,
                  mb: 0.5
                }}
              >
                {t('labels.referredTo')}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#2d3748',
                  fontWeight: 500
                }}
              >
                Dr. {report.referralDoctorName}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Date and Actions */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mt="auto">
          <Box display="flex" alignItems="center">
            <Box
              sx={{
                p: 1,
                borderRadius: '12px',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                color: '#a855f7',
                mr: 2,
              }}
            >
              <EventIcon />
            </Box>
            <Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#64748b',
                  fontWeight: 600,
                  mb: 0.5
                }}
              >
                {t('labels.created')}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#2d3748',
                  fontWeight: 500
                }}
              >
                {new Date(report.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </Typography>
            </Box>
          </Box>
          
          {/* Action Buttons */}
          <Box display="flex" gap={1}>
            {onView && (
              <Tooltip title={t('actions.viewReport')} arrow>
                <IconButton
                  size="small"
                  sx={{
                    color: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      transform: 'scale(1.1)',
                    },
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(report.reportId);
                  }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {onEdit && (
              <Tooltip title={t('actions.editReport')} arrow>
                <IconButton
                  size="small"
                  sx={{
                    color: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      transform: 'scale(1.1)',
                    },
                  }}
                  onClick={(e) => onEdit(e, report.reportId)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {onDelete && (
              <Tooltip title={t('actions.deleteReport')} arrow>
                <IconButton
                  size="small"
                  disabled={deleteLoading}
                  sx={{
                    color: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      transform: 'scale(1.1)',
                    },
                    '&:disabled': {
                      opacity: 0.5,
                    },
                  }}
                  onClick={(e) => onDelete(e, report.reportId)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

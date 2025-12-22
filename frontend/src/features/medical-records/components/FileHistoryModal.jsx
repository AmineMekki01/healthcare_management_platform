import React, { useState, useEffect, useContext } from 'react';
import { X, Clock, Upload, Share2, Edit, Trash2, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import axios from '../../../components/axiosConfig';
import { AuthContext } from '../../auth/context/AuthContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Fade,
  Slide,
  Chip,
} from '@mui/material';
import { Close as CloseIcon, History as HistoryIcon } from '@mui/icons-material';

const FileHistoryModal = ({ isOpen, onClose, itemId, itemName }) => {
  const { t, i18n } = useTranslation('medical');
  const { userId } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const locales = {
    ar: ar,
    fr: fr,
    en: enUS,
  };

  useEffect(() => {
    if (isOpen && itemId) {
      fetchHistory();
    }
  }, [isOpen, itemId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/v1/records/items/${itemId}/history`);
      setHistory(response.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(t('history.error'));
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'upload':
        return <Upload className="w-5 h-5 text-blue-500" />;
      case 'share':
        return <Share2 className="w-5 h-5 text-green-500" />;
      case 'rename':
        return <Edit className="w-5 h-5 text-orange-500" />;
      case 'delete':
        return <Trash2 className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActionMessage = (entry) => {
    const { action_type, performed_by_id, performed_by_name, old_value, new_value, shared_with_id, shared_with_name } = entry;
    const isCurrentUser = performed_by_id === userId;
    const isSharedWithCurrentUser = shared_with_id === userId;

    switch (action_type) {
      case 'upload':
        if (isCurrentUser) {
          return t('history.uploadedByYou');
        }
        return t('history.uploaded', { user: performed_by_name || 'Unknown' });
      
      case 'share':
        if (isCurrentUser) {
          return t('history.sharedByYou', { recipient: shared_with_name || 'Unknown' });
        } else if (isSharedWithCurrentUser) {
          return t('history.sharedWithYou', { user: performed_by_name || 'Unknown' });
        }
        return t('history.shared', { 
          user: performed_by_name || 'Unknown', 
          recipient: shared_with_name || 'Unknown'
        });
      
      case 'rename':
        if (isCurrentUser) {
          return t('history.renamedByYou', { 
            oldName: old_value || 'Unknown', 
            newName: new_value || 'Unknown'
          });
        }
        return t('history.renamed', { 
          user: performed_by_name || 'Unknown', 
          oldName: old_value || 'Unknown', 
          newName: new_value || 'Unknown'
        });
      
      case 'delete':
        if (isCurrentUser) {
          return t('history.deletedByYou');
        }
        return t('history.deleted', { user: performed_by_name || 'Unknown' });
      
      default:
        return t('history.unknown');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const locale = locales[i18n.language] || enUS;
    return format(date, 'PPpp', { locale });
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 300 }}
      PaperProps={{
        sx: {
          borderRadius: 4,
          maxHeight: '90vh',
          boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          pt: 5, 
          pb: 3, 
          px: 5,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%)',
          }
        }}
      >
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" position="relative" zIndex={1}>
          <Box flex={1} display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <HistoryIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  mb: 0.5,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                {t('history.title')}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <FileText size={14} style={{ opacity: 0.9 }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    opacity: 0.95,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  {itemName}
                </Typography>
              </Box>
            </Box>
          </Box>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{
              color: 'white',
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                transform: 'rotate(90deg)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent 
        sx={{ 
          minHeight: 400,
          px: 5,
          py: 4,
          pt: '32px !important',
          bgcolor: '#fafbfc',
        }}
      >
        {loading ? (
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" py={12}>
            <CircularProgress size={40} thickness={4} sx={{ color: '#667eea', mb: 2 }} />
            <Typography sx={{ color: '#86868b', fontSize: '0.875rem' }}>Loading history...</Typography>
          </Box>
        ) : error ? (
          <Box textAlign="center" py={12}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#fee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <X size={32} color="#ef4444" />
            </Box>
            <Typography 
              sx={{ 
                color: '#1f2937',
                fontSize: '1rem',
                fontWeight: 600,
                mb: 1,
              }}
            >
              {error}
            </Typography>
            <Button
              onClick={fetchHistory}
              variant="contained"
              sx={{ 
                mt: 2,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: 2.5,
                fontSize: '0.9375rem',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {t('history.retry')}
            </Button>
          </Box>
        ) : history.length === 0 ? (
          <Box textAlign="center" py={12}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <HistoryIcon sx={{ fontSize: 40, color: '#9ca3af' }} />
            </Box>
            <Typography sx={{ color: '#6b7280', fontSize: '1rem', fontWeight: 500 }}>
              {t('history.noHistory')}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {history.map((entry, index) => {
              const actionColors = {
                share: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', light: '#f0f4ff' },
                upload: { bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', light: '#f0fdf4' },
                rename: { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', light: '#fef3f2' },
                delete: { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', light: '#fef2f2' },
              };
              const colors = actionColors[entry.action_type] || { bg: '#9ca3af', light: '#f9fafb' };
              
              return (
                <Fade in={true} timeout={300 + index * 100} key={entry.id || index}>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 3,
                      p: 3,
                      bgcolor: 'white',
                      borderRadius: 3,
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                        transform: 'translateY(-2px)',
                        borderColor: '#d1d5db',
                        '&::before': {
                          opacity: 1,
                        },
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: colors.bg,
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                      },
                    }}
                  >
                    {/* Icon with gradient */}
                    <Box
                      sx={{
                        flexShrink: 0,
                        width: 48,
                        height: 48,
                        borderRadius: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: colors.bg,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 2.5,
                          padding: '2px',
                          background: colors.bg,
                          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          WebkitMaskComposite: 'xor',
                          maskComposite: 'exclude',
                        },
                      }}
                    >
                      <Box sx={{ position: 'relative', zIndex: 1, color: 'white', display: 'flex' }}>
                        {getActionIcon(entry.action_type)}
                      </Box>
                    </Box>
                    
                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                        <Typography 
                          sx={{ 
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#111827',
                            lineHeight: 1.5,
                          }}
                        >
                          {getActionMessage(entry)}
                        </Typography>
                        <Chip
                          label={t(`history.actionTypes.${entry.action_type}`)}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            background: colors.bg,
                            color: 'white',
                            border: 'none',
                          }}
                        />
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Clock size={14} color="#9ca3af" />
                        <Typography 
                          sx={{ 
                            fontSize: '0.8125rem',
                            color: '#6b7280',
                            fontWeight: 500,
                          }}
                        >
                          {formatDate(entry.created_at)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Fade>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 5, py: 3, bgcolor: 'white', borderTop: '1px solid #e5e7eb' }}>
        <Button
          onClick={onClose}
          fullWidth
          variant="contained"
          sx={{
            textTransform: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '0.9375rem',
            fontWeight: 600,
            py: 1.75,
            borderRadius: 2.5,
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          {t('history.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileHistoryModal;

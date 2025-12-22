import React, { useState, useEffect, useContext } from 'react';
import { X, Clock, Upload, Share2, Edit, Trash2 } from 'lucide-react';
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
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {t('history.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {itemName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ minHeight: 300 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box textAlign="center" py={8}>
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={fetchHistory}
              sx={{ mt: 2 }}
            >
              {t('history.retry')}
            </Button>
          </Box>
        ) : history.length === 0 ? (
          <Box textAlign="center" py={8}>
            <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">
              {t('history.noHistory')}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {history.map((entry, index) => (
              <Box
                key={entry.id || index}
                sx={{
                  display: 'flex',
                  gap: 2,
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'grey.100',
                  },
                  transition: 'background-color 0.2s',
                }}
              >
                <Box sx={{ flexShrink: 0, mt: 0.5 }}>
                  {getActionIcon(entry.action_type)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" color="text.primary">
                    {getActionMessage(entry)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {formatDate(entry.created_at)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          {t('history.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileHistoryModal;

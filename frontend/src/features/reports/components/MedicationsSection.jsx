import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Grid,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  LocalPharmacy as PharmacyIcon
} from '@mui/icons-material';

export default function MedicationsSection({
  medications = [],
  onAddMedication,
  onUpdateMedication,
  onRemoveMedication,
  disabled = false
}) {
  const { t, i18n } = useTranslation('reports');

  const isRtl = (i18n.language || '').startsWith('ar');
  const rtlTextFieldSx = isRtl
    ? {
        '& .MuiOutlinedInput-root': {
          direction: 'rtl',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          textAlign: 'right',
        },
        '& .MuiInputLabel-root': {
          left: 'auto',
          right: 14,
          transformOrigin: 'top right',
          textAlign: 'right',
          transform: 'translate(0, 16px) scale(1)',
        },
        '& .MuiInputLabel-root.MuiInputLabel-shrink': {
          transformOrigin: 'top right',
          transform: 'translate(0, -9px) scale(0.75)',
        },
        '& .MuiOutlinedInput-input': {
          direction: 'rtl',
          textAlign: 'right',
        },
      }
    : undefined;

  const handleMedicationChange = (medicationId, field) => (event) => {
    onUpdateMedication(medicationId, field, event.target.value);
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <PharmacyIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h2">
            {t('medications.title')}
          </Typography>
        </Box>
        
        {medications.length === 0 ? (
          <Box textAlign="center" py={3}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {t('medications.none')}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={onAddMedication}
              disabled={disabled}
            >
              {t('medications.addMedication')}
            </Button>
          </Box>
        ) : (
          <>
            {medications.map((medication, index) => (
              <Box key={medication.id} mb={3}>
                {index > 0 && <Divider sx={{ mb: 3 }} />}
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1" color="text.secondary">
                    {t('medications.medicationNumber', { number: index + 1 })}
                  </Typography>
                  <IconButton
                    onClick={() => onRemoveMedication(medication.id)}
                    disabled={disabled}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('medications.fields.medicationName')}
                      value={medication.medicationName || ''}
                      onChange={handleMedicationChange(medication.id, 'medicationName')}
                      disabled={disabled}
                      required
                      placeholder={t('medications.placeholders.medicationName')}
                      sx={rtlTextFieldSx}
                      inputProps={{ dir: isRtl ? 'rtl' : 'ltr' }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('medications.fields.dosage')}
                      value={medication.dosage || ''}
                      onChange={handleMedicationChange(medication.id, 'dosage')}
                      disabled={disabled}
                      required
                      placeholder={t('medications.placeholders.dosage')}
                      sx={rtlTextFieldSx}
                      inputProps={{ dir: isRtl ? 'rtl' : 'ltr' }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('medications.fields.frequency')}
                      value={medication.frequency || ''}
                      onChange={handleMedicationChange(medication.id, 'frequency')}
                      disabled={disabled}
                      required
                      placeholder={t('medications.placeholders.frequency')}
                      sx={rtlTextFieldSx}
                      inputProps={{ dir: isRtl ? 'rtl' : 'ltr' }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('medications.fields.duration')}
                      value={medication.duration || ''}
                      onChange={handleMedicationChange(medication.id, 'duration')}
                      disabled={disabled}
                      required
                      placeholder={t('medications.placeholders.duration')}
                      sx={rtlTextFieldSx}
                      inputProps={{ dir: isRtl ? 'rtl' : 'ltr' }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('medications.fields.instructions')}
                      value={medication.instructions || ''}
                      onChange={handleMedicationChange(medication.id, 'instructions')}
                      disabled={disabled}
                      multiline
                      rows={2}
                      placeholder={t('medications.placeholders.instructions')}
                      sx={rtlTextFieldSx}
                      inputProps={{ dir: isRtl ? 'rtl' : 'ltr' }}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
            
            <Box mt={2}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={onAddMedication}
                disabled={disabled}
                fullWidth
              >
                {t('medications.addAnother')}
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}

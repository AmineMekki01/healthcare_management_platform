import React from 'react';
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
  const handleMedicationChange = (medicationId, field) => (event) => {
    onUpdateMedication(medicationId, field, event.target.value);
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <PharmacyIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h2">
            Prescribed Medications
          </Typography>
        </Box>
        
        {medications.length === 0 ? (
          <Box textAlign="center" py={3}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              No medications prescribed yet
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={onAddMedication}
              disabled={disabled}
            >
              Add Medication
            </Button>
          </Box>
        ) : (
          <>
            {medications.map((medication, index) => (
              <Box key={medication.id} mb={3}>
                {index > 0 && <Divider sx={{ mb: 3 }} />}
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Medication {index + 1}
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
                      label="Medication Name"
                      value={medication.medicationName || ''}
                      onChange={handleMedicationChange(medication.id, 'medicationName')}
                      disabled={disabled}
                      required
                      placeholder="e.g., Amoxicillin"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Dosage"
                      value={medication.dosage || ''}
                      onChange={handleMedicationChange(medication.id, 'dosage')}
                      disabled={disabled}
                      required
                      placeholder="e.g., 500mg, 1 tablet"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Frequency"
                      value={medication.frequency || ''}
                      onChange={handleMedicationChange(medication.id, 'frequency')}
                      disabled={disabled}
                      required
                      placeholder="e.g., Twice daily, Every 8 hours"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Duration"
                      value={medication.duration || ''}
                      onChange={handleMedicationChange(medication.id, 'duration')}
                      disabled={disabled}
                      required
                      placeholder="e.g., 7 days, 2 weeks"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Special Instructions"
                      value={medication.instructions || ''}
                      onChange={handleMedicationChange(medication.id, 'instructions')}
                      disabled={disabled}
                      multiline
                      rows={2}
                      placeholder="e.g., Take with food, Avoid alcohol"
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
                Add Another Medication
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}

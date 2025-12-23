import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocalHospital as HealthIcon,
  Vaccines as VaccineIcon,
} from '@mui/icons-material';
import { Heart, Activity, AlertCircle, Users, Pill } from 'lucide-react';
import { AuthContext } from '../../auth/context/AuthContext';
import healthProfileService from '../../../services/healthProfileService';

const HealthProfile = () => {
  const { t } = useTranslation('medical');
  const { userId, userType } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profile, setProfile] = useState(null);
  const [vaccinations, setVaccinations] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [vaccinationDialogOpen, setVaccinationDialogOpen] = useState(false);
  const [currentVaccination, setCurrentVaccination] = useState(null);

  const [formData, setFormData] = useState({
    bloodGroup: '',
    heightCm: '',
    weightKg: '',
    allergies: [],
    chronicConditions: [],
    currentMedications: [],
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    smokingStatus: '',
    alcoholConsumption: '',
    exerciseFrequency: '',
    dietaryRestrictions: [],
    familyHistory: '',
    notes: '',
  });

  const [newItem, setNewItem] = useState({
    allergy: '',
    condition: '',
    medication: '',
    restriction: '',
  });

  useEffect(() => {
    if (userId) {
      fetchHealthProfile();
      fetchVaccinations();
    }
  }, [userId]);

  const fetchHealthProfile = async () => {
    try {
      setLoading(true);
      const data = await healthProfileService.getHealthProfile(userId, userType);
      setProfile(data);
      setFormData({
        bloodGroup: data.bloodGroup || '',
        heightCm: data.heightCm || '',
        weightKg: data.weightKg || '',
        allergies: data.allergies || [],
        chronicConditions: data.chronicConditions || [],
        currentMedications: data.currentMedications || [],
        emergencyContactName: data.emergencyContactName || '',
        emergencyContactPhone: data.emergencyContactPhone || '',
        emergencyContactRelationship: data.emergencyContactRelationship || '',
        smokingStatus: data.smokingStatus || '',
        alcoholConsumption: data.alcoholConsumption || '',
        exerciseFrequency: data.exerciseFrequency || '',
        dietaryRestrictions: data.dietaryRestrictions || [],
        familyHistory: data.familyHistory || '',
        notes: data.notes || '',
      });
    } catch (err) {
      setError(t('healthProfile.errorUpdate'));
    } finally {
      setLoading(false);
    }
  };

  const fetchVaccinations = async () => {
    try {
      const data = await healthProfileService.getVaccinations(userId, userType);
      setVaccinations(data || []);
    } catch (err) {
      console.error('Error fetching vaccinations:', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const updateData = {
        bloodGroup: formData.bloodGroup || null,
        heightCm: formData.heightCm ? parseFloat(formData.heightCm) : null,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
        allergies: formData.allergies.length > 0 ? formData.allergies : null,
        chronicConditions: formData.chronicConditions.length > 0 ? formData.chronicConditions : null,
        currentMedications: formData.currentMedications.length > 0 ? formData.currentMedications : null,
        emergencyContactName: formData.emergencyContactName || null,
        emergencyContactPhone: formData.emergencyContactPhone || null,
        emergencyContactRelationship: formData.emergencyContactRelationship || null,
        smokingStatus: formData.smokingStatus || null,
        alcoholConsumption: formData.alcoholConsumption || null,
        exerciseFrequency: formData.exerciseFrequency || null,
        dietaryRestrictions: formData.dietaryRestrictions.length > 0 ? formData.dietaryRestrictions : null,
        familyHistory: formData.familyHistory || null,
        notes: formData.notes || null,
      };

      await healthProfileService.updateHealthProfile(userId, userType, updateData);
      setSuccess(t('healthProfile.successUpdate'));
      setEditMode(false);
      await fetchHealthProfile();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t('healthProfile.errorUpdate'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    if (profile) {
      setFormData({
        bloodGroup: profile.bloodGroup || '',
        heightCm: profile.heightCm || '',
        weightKg: profile.weightKg || '',
        allergies: profile.allergies || [],
        chronicConditions: profile.chronicConditions || [],
        currentMedications: profile.currentMedications || [],
        emergencyContactName: profile.emergencyContactName || '',
        emergencyContactPhone: profile.emergencyContactPhone || '',
        emergencyContactRelationship: profile.emergencyContactRelationship || '',
        smokingStatus: profile.smokingStatus || '',
        alcoholConsumption: profile.alcoholConsumption || '',
        exerciseFrequency: profile.exerciseFrequency || '',
        dietaryRestrictions: profile.dietaryRestrictions || [],
        familyHistory: profile.familyHistory || '',
        notes: profile.notes || '',
      });
    }
  };

  const addArrayItem = (field, value) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      setNewItem(prev => ({ ...prev, [field.replace(/s$/, '')]: '' }));
    }
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const calculateBMI = () => {
    if (formData.heightCm && formData.weightKg) {
      const heightM = parseFloat(formData.heightCm) / 100;
      const weight = parseFloat(formData.weightKg);
      const bmi = weight / (heightM * heightM);
      return bmi.toFixed(1);
    }
    return '-';
  };

  const handleVaccinationSave = async (vaccinationData) => {
    try {
      if (currentVaccination) {
        await healthProfileService.updateVaccination(userId, userType, currentVaccination.vaccinationId, vaccinationData);
      } else {
        await healthProfileService.createVaccination(userId, userType, vaccinationData);
      }
      setSuccess(t('healthProfile.successVaccination'));
      setVaccinationDialogOpen(false);
      setCurrentVaccination(null);
      await fetchVaccinations();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t('healthProfile.errorVaccination'));
    }
  };

  const handleVaccinationDelete = async (vaccinationId) => {
    if (window.confirm(t('healthProfile.confirmDelete'))) {
      try {
        await healthProfileService.deleteVaccination(userId, userType, vaccinationId);
        setSuccess(t('healthProfile.successVaccination'));
        await fetchVaccinations();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(t('healthProfile.errorVaccination'));
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HealthIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {t('healthProfile.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('healthProfile.subtitle')}
            </Typography>
          </Box>
        </Box>
        
        {!editMode ? (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setEditMode(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textTransform: 'none',
              px: 3,
            }}
          >
            {t('healthProfile.edit')}
          </Button>
        ) : (
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={saving}
              sx={{ textTransform: 'none' }}
            >
              {t('healthProfile.cancel')}
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                textTransform: 'none',
              }}
            >
              {saving ? <CircularProgress size={20} /> : t('healthProfile.save')}
            </Button>
          </Box>
        )}
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
              <Heart size={24} color="#667eea" />
              <Typography variant="h6" fontWeight={600}>
                {t('healthProfile.basicInfo')}
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label={t('healthProfile.bloodGroup')}
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  disabled={!editMode}
                  size="small"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map(group => (
                    <MenuItem key={group} value={group}>{group}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('healthProfile.height')}
                  value={formData.heightCm}
                  onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                  disabled={!editMode}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('healthProfile.weight')}
                  value={formData.weightKg}
                  onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                  disabled={!editMode}
                  size="small"
                />
              </Grid>
              
              {formData.heightCm && formData.weightKg && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                      border: '1px solid #667eea30',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {t('healthProfile.bmi')}: <strong>{calculateBMI()}</strong>
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Allergies */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, minHeight: 250 }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <AlertCircle size={24} color="#ef4444" />
              <Typography variant="h6" fontWeight={600}>
                {t('healthProfile.allergies')}
              </Typography>
            </Box>
            
            {editMode && (
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('healthProfile.addAllergy')}
                  value={newItem.allergy}
                  onChange={(e) => setNewItem({ ...newItem, allergy: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addArrayItem('allergies', newItem.allergy);
                    }
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={() => addArrayItem('allergies', newItem.allergy)}
                  sx={{ bgcolor: '#667eea15' }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            )}
            
            <Box display="flex" flexWrap="wrap" gap={1}>
              {formData.allergies.length > 0 ? (
                formData.allergies.map((allergy, index) => (
                  <Chip
                    key={index}
                    label={allergy}
                    onDelete={editMode ? () => removeArrayItem('allergies', index) : undefined}
                    sx={{
                      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                      color: '#991b1b',
                      fontWeight: 500,
                    }}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('healthProfile.noAllergies')}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Chronic Conditions */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, minHeight: 250 }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <Activity size={24} color="#f59e0b" />
              <Typography variant="h6" fontWeight={600}>
                {t('healthProfile.chronicConditions')}
              </Typography>
            </Box>
            
            {editMode && (
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('healthProfile.addCondition')}
                  value={newItem.condition}
                  onChange={(e) => setNewItem({ ...newItem, condition: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addArrayItem('chronicConditions', newItem.condition);
                    }
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={() => addArrayItem('chronicConditions', newItem.condition)}
                  sx={{ bgcolor: '#667eea15' }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            )}
            
            <Box display="flex" flexWrap="wrap" gap={1}>
              {formData.chronicConditions.length > 0 ? (
                formData.chronicConditions.map((condition, index) => (
                  <Chip
                    key={index}
                    label={condition}
                    onDelete={editMode ? () => removeArrayItem('chronicConditions', index) : undefined}
                    sx={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      color: '#92400e',
                      fontWeight: 500,
                    }}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('healthProfile.noConditions')}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Current Medications */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <Pill size={24} color="#10b981" />
              <Typography variant="h6" fontWeight={600}>
                {t('healthProfile.currentMedications')}
              </Typography>
            </Box>
            
            {editMode && (
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('healthProfile.addMedication')}
                  value={newItem.medication}
                  onChange={(e) => setNewItem({ ...newItem, medication: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addArrayItem('currentMedications', newItem.medication);
                    }
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={() => addArrayItem('currentMedications', newItem.medication)}
                  sx={{ bgcolor: '#667eea15' }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            )}
            
            <Box display="flex" flexWrap="wrap" gap={1}>
              {formData.currentMedications.length > 0 ? (
                formData.currentMedications.map((medication, index) => (
                  <Chip
                    key={index}
                    label={medication}
                    onDelete={editMode ? () => removeArrayItem('currentMedications', index) : undefined}
                    sx={{
                      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                      color: '#065f46',
                      fontWeight: 500,
                    }}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('healthProfile.noMedications')}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Emergency Contact */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
              <Users size={24} color="#dc2626" />
              <Typography variant="h6" fontWeight={600}>
                {t('healthProfile.emergencyContact')}
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label={t('healthProfile.contactName')}
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  disabled={!editMode}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label={t('healthProfile.contactPhone')}
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  disabled={!editMode}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label={t('healthProfile.contactRelationship')}
                  value={formData.emergencyContactRelationship}
                  onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                  disabled={!editMode}
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Lifestyle */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              {t('healthProfile.lifestyle')}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label={t('healthProfile.smokingStatus')}
                  value={formData.smokingStatus}
                  onChange={(e) => setFormData({ ...formData, smokingStatus: e.target.value })}
                  disabled={!editMode}
                  size="small"
                >
                  {['never', 'former', 'current', 'unknown'].map(status => (
                    <MenuItem key={status} value={status}>
                      {t(`healthProfile.smokingOptions.${status}`)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label={t('healthProfile.alcoholConsumption')}
                  value={formData.alcoholConsumption}
                  onChange={(e) => setFormData({ ...formData, alcoholConsumption: e.target.value })}
                  disabled={!editMode}
                  size="small"
                >
                  {['none', 'occasional', 'moderate', 'heavy', 'unknown'].map(level => (
                    <MenuItem key={level} value={level}>
                      {t(`healthProfile.alcoholOptions.${level}`)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label={t('healthProfile.exerciseFrequency')}
                  value={formData.exerciseFrequency}
                  onChange={(e) => setFormData({ ...formData, exerciseFrequency: e.target.value })}
                  disabled={!editMode}
                  size="small"
                >
                  {['none', 'rarely', 'weekly', 'daily', 'unknown'].map(freq => (
                    <MenuItem key={freq} value={freq}>
                      {t(`healthProfile.exerciseOptions.${freq}`)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Dietary Restrictions */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              {t('healthProfile.dietaryRestrictions')}
            </Typography>
            
            {editMode && (
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('healthProfile.addRestriction')}
                  value={newItem.restriction}
                  onChange={(e) => setNewItem({ ...newItem, restriction: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addArrayItem('dietaryRestrictions', newItem.restriction);
                    }
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={() => addArrayItem('dietaryRestrictions', newItem.restriction)}
                  sx={{ bgcolor: '#667eea15' }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            )}
            
            <Box display="flex" flexWrap="wrap" gap={1}>
              {formData.dietaryRestrictions.length > 0 ? (
                formData.dietaryRestrictions.map((restriction, index) => (
                  <Chip
                    key={index}
                    label={restriction}
                    onDelete={editMode ? () => removeArrayItem('dietaryRestrictions', index) : undefined}
                    sx={{
                      background: 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)',
                      color: '#5b21b6',
                      fontWeight: 500,
                    }}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('healthProfile.noRestrictions')}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Family History & Notes */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              {t('healthProfile.familyHistory')}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={formData.familyHistory}
              onChange={(e) => setFormData({ ...formData, familyHistory: e.target.value })}
              disabled={!editMode}
              placeholder={t('healthProfile.familyHistory')}
            />
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" fontWeight={600} mb={2}>
              {t('healthProfile.notes')}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={!editMode}
              placeholder={t('healthProfile.notes')}
            />
          </Paper>
        </Grid>

        {/* Vaccinations Section */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <VaccineIcon sx={{ fontSize: 28, color: '#667eea' }} />
                <Typography variant="h6" fontWeight={600}>
                  {t('healthProfile.vaccinations')}
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setCurrentVaccination(null);
                  setVaccinationDialogOpen(true);
                }}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  textTransform: 'none',
                }}
              >
                {t('healthProfile.addVaccination')}
              </Button>
            </Box>
            
            {vaccinations.length > 0 ? (
              <Grid container spacing={2}>
                {vaccinations.map((vaccination) => (
                  <Grid item xs={12} md={6} key={vaccination.vaccinationId}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid #e5e7eb',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        },
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {vaccination.vaccineName}
                        </Typography>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setCurrentVaccination(vaccination);
                              setVaccinationDialogOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleVaccinationDelete(vaccination.vaccinationId)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      {vaccination.vaccineType && (
                        <Typography variant="body2" color="text.secondary">
                          {vaccination.vaccineType}
                        </Typography>
                      )}
                      {vaccination.dateAdministered && (
                        <Typography variant="body2" color="text.secondary">
                          {new Date(vaccination.dateAdministered).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('healthProfile.noVaccinations')}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Vaccination Dialog */}
      <VaccinationDialog
        open={vaccinationDialogOpen}
        onClose={() => {
          setVaccinationDialogOpen(false);
          setCurrentVaccination(null);
        }}
        onSave={handleVaccinationSave}
        vaccination={currentVaccination}
      />
    </Box>
  );
};

// Vaccination Dialog Component
const VaccinationDialog = ({ open, onClose, onSave, vaccination }) => {
  const { t } = useTranslation('medical');
  const [formData, setFormData] = useState({
    vaccineName: '',
    vaccineType: '',
    dateAdministered: '',
    nextDoseDate: '',
    administeredBy: '',
    location: '',
    batchNumber: '',
    notes: '',
  });

  useEffect(() => {
    if (vaccination) {
      setFormData({
        vaccineName: vaccination.vaccineName || '',
        vaccineType: vaccination.vaccineType || '',
        dateAdministered: vaccination.dateAdministered ? vaccination.dateAdministered.split('T')[0] : '',
        nextDoseDate: vaccination.nextDoseDate ? vaccination.nextDoseDate.split('T')[0] : '',
        administeredBy: vaccination.administeredBy || '',
        location: vaccination.location || '',
        batchNumber: vaccination.batchNumber || '',
        notes: vaccination.notes || '',
      });
    } else {
      setFormData({
        vaccineName: '',
        vaccineType: '',
        dateAdministered: '',
        nextDoseDate: '',
        administeredBy: '',
        location: '',
        batchNumber: '',
        notes: '',
      });
    }
  }, [vaccination, open]);

  const handleSubmit = () => {
    const data = {
      vaccineName: formData.vaccineName,
      vaccineType: formData.vaccineType || null,
      dateAdministered: formData.dateAdministered ? formData.dateAdministered : null,
      nextDoseDate: formData.nextDoseDate ? formData.nextDoseDate : null,
      administeredBy: formData.administeredBy || null,
      location: formData.location || null,
      batchNumber: formData.batchNumber || null,
      notes: formData.notes || null,
    };
    onSave(data);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {vaccination ? t('healthProfile.edit') : t('healthProfile.addVaccination')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label={t('healthProfile.vaccineName')}
                value={formData.vaccineName}
                onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('healthProfile.vaccineType')}
                value={formData.vaccineType}
                onChange={(e) => setFormData({ ...formData, vaccineType: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label={t('healthProfile.dateAdministered')}
                value={formData.dateAdministered}
                onChange={(e) => setFormData({ ...formData, dateAdministered: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label={t('healthProfile.nextDoseDate')}
                value={formData.nextDoseDate}
                onChange={(e) => setFormData({ ...formData, nextDoseDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('healthProfile.administeredBy')}
                value={formData.administeredBy}
                onChange={(e) => setFormData({ ...formData, administeredBy: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('healthProfile.location')}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('healthProfile.batchNumber')}
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('healthProfile.notes')}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('healthProfile.cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!formData.vaccineName}
          sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          {t('healthProfile.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HealthProfile;

import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../auth/context/AuthContext';
import DoctorAutocomplete from '../../../components/DoctorAutocomplete';
import MedicationsSection from '../components/MedicationsSection';
import { reportsService } from '../services';
import { useReportForm } from '../hooks';
import { buildSpecialtyOptions, normalizeSpecialtyCode, getLocalizedSpecialtyLabel } from '../../../utils/specialties';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Event as EventIcon,
  LocalHospital as LocalHospitalIcon
} from '@mui/icons-material';

export default function CreateMedicalReportPage() {
  const { appointmentId } = useParams();
  const { userId } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('reports');
  const { t: tMedical } = useTranslation('medical');

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

  const getLocalizedName = (firstName, lastName, firstNameAr, lastNameAr) => {
    const preferredFirst = isRtl && firstNameAr ? firstNameAr : firstName;
    const preferredLast = isRtl && lastNameAr ? lastNameAr : lastName;
    return [preferredFirst, preferredLast].filter(Boolean).join(' ');
  };
  
  const [appointmentLoading, setAppointmentLoading] = useState(true);
  const [appointmentData, setAppointmentData] = useState(null);
  const [appointmentError, setAppointmentError] = useState('');

  const {
    formData,
    errors,
    warnings,
    loading,
    success,
    handleChange,
    handleReferralDoctorChange,
    submitForm,
    clearMessages,
    addMedication,
    updateMedication,
    removeMedication
  } = useReportForm();

  const specialtyOptions = buildSpecialtyOptions(tMedical);

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        setAppointmentLoading(true);
        const data = await reportsService.fetchAppointmentDetails(appointmentId);
        setAppointmentData(data);
        setAppointmentError('');
      } catch (error) {
        console.error('Error fetching appointment details:', error);
        setAppointmentError(t('errors.loadAppointmentDetails'));
      } finally {
        setAppointmentLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointmentDetails();
    }
  }, [appointmentId, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    try {
      const success = await submitForm(appointmentId, userId, appointmentData?.patientId, appointmentData);
      
      if (success) {
        setTimeout(() => {
          navigate(`/medical-report/${userId}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  if (appointmentLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {t('status.loadingAppointmentDetails')}
        </Typography>
      </Container>
    );
  }

  if (!appointmentData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          {appointmentError || t('pages.createMedicalReport.appointmentNotFound')}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/appointments')}
          sx={{ mr: 2 }}
        >
          {t('pages.createMedicalReport.backToAppointments')}
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {t('pages.createMedicalReport.title')}
        </Typography>
      </Box>

      <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <EventIcon sx={{ mr: 1 }} />
            {t('pages.createMedicalReport.appointmentDetails')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center">
                <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>
                  <strong>{t('labels.patient')}:</strong>{' '}
                  {getLocalizedName(
                    appointmentData.patientFirstName,
                    appointmentData.patientLastName,
                    appointmentData.patientFirstNameAr || appointmentData.patient_first_name_ar,
                    appointmentData.patientLastNameAr || appointmentData.patient_last_name_ar
                  )}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center">
                <EventIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>
                  <strong>{t('common:common.date')}:</strong> {new Date(appointmentData.appointmentStart).toLocaleDateString(i18n.language || undefined)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center">
                <LocalHospitalIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>
                  <strong>{t('common:common.time')}:</strong> {new Date(appointmentData.appointmentStart).toLocaleTimeString(i18n.language || undefined)} - {new Date(appointmentData.appointmentEnd).toLocaleTimeString(i18n.language || undefined)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          {t('form.medicalReportForm')}
        </Typography>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}
        {warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {warnings.map((warning, index) => (
              <div key={index}>{warning}</div>
            ))}
          </Alert>
        )}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              {t('form.diagnosisInformation')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.diagnosisMade}
                      onChange={handleChange('diagnosisMade')}
                    />
                  }
                  label={t('form.diagnosisMade')}
                  sx={{ mb: 1 }}
                />
              </Grid>
              
              {formData.diagnosisMade && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('form.diagnosisName')}
                      value={formData.diagnosisName}
                      onChange={handleChange('diagnosisName')}
                      required
                      placeholder={t('placeholders.diagnosisName')}
                      sx={rtlTextFieldSx}
                      inputProps={{ dir: isRtl ? 'rtl' : 'ltr' }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('form.diagnosisDetails')}
                      value={formData.diagnosisDetails}
                      onChange={handleChange('diagnosisDetails')}
                      multiline
                      rows={3}
                      placeholder={t('placeholders.diagnosisDetails')}
                      sx={rtlTextFieldSx}
                      inputProps={{ dir: isRtl ? 'rtl' : 'ltr' }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>

          <Box mb={3}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              {t('form.examinationReport')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TextField
              fullWidth
              label={t('form.reportContent')}
              value={formData.reportContent}
              onChange={handleChange('reportContent')}
              multiline
              rows={6}
              required
              placeholder={t('placeholders.reportContent')}
              sx={rtlTextFieldSx}
              inputProps={{ dir: isRtl ? 'rtl' : 'ltr' }}
            />
          </Box>

          <Box mb={3}>
            <MedicationsSection
              medications={formData.medications}
              onAddMedication={addMedication}
              onUpdateMedication={updateMedication}
              onRemoveMedication={removeMedication}
              disabled={loading}
            />
          </Box>

          <Box mb={3}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              {t('form.referralInformation')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.referralNeeded}
                  onChange={handleChange('referralNeeded')}
                />
              }
              label={t('form.referralRequired')}
              sx={{ mb: 2 }}
            />

            {formData.referralNeeded && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={rtlTextFieldSx}>
                    <InputLabel id="referralSpecialty-label">{t('form.referralSpecialty')}</InputLabel>
                    <Select
                      labelId="referralSpecialty-label"
                      value={normalizeSpecialtyCode(formData.referralSpecialty) || ''}
                      label={t('form.referralSpecialty')}
                      onChange={handleChange('referralSpecialty')}
                      displayEmpty
                      inputProps={{ dir: isRtl ? 'rtl' : 'ltr' }}
                      renderValue={(selected) => (
                        selected
                          ? getLocalizedSpecialtyLabel(selected, tMedical)
                          : t('placeholders.referralSpecialty')
                      )}
                    >
                      <MenuItem value="">
                        <em>{t('placeholders.referralSpecialty')}</em>
                      </MenuItem>
                      {specialtyOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DoctorAutocomplete
                    value={formData.referralDoctorName}
                    onChange={handleReferralDoctorChange}
                    specialty={normalizeSpecialtyCode(formData.referralSpecialty)}
                    label={t('form.referredDoctorName')}
                    placeholder={t('placeholders.referredDoctorName')}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('form.referralMessage')}
                    value={formData.referralMessage}
                    onChange={handleChange('referralMessage')}
                    multiline
                    rows={3}
                    placeholder={t('placeholders.referralMessage')}
                    sx={rtlTextFieldSx}
                    inputProps={{ dir: isRtl ? 'rtl' : 'ltr' }}
                  />
                </Grid>
              </Grid>
            )}
          </Box>

          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button
              variant="outlined"
              onClick={() => navigate('/appointments')}
              disabled={loading}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading}
              sx={{ minWidth: 150 }}
            >
              {loading ? t('status.creating') : t('actions.createReport')}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}
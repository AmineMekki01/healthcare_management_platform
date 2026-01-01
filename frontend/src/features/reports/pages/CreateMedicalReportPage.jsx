import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/context/AuthContext';
import DoctorAutocomplete from '../../../components/DoctorAutocomplete';
import MedicationsSection from '../components/MedicationsSection';
import { reportsService } from '../services';
import { useReportForm } from '../hooks';
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
  Checkbox
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

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        setAppointmentLoading(true);
        const data = await reportsService.fetchAppointmentDetails(appointmentId);
        setAppointmentData(data);
        setAppointmentError('');
      } catch (error) {
        console.error('Error fetching appointment details:', error);
        setAppointmentError('Failed to load appointment details');
      } finally {
        setAppointmentLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointmentDetails();
    }
  }, [appointmentId]);

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
          Loading appointment details...
        </Typography>
      </Container>
    );
  }

  if (!appointmentData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          {appointmentError || 'Appointment not found or you don\'t have permission to create a report for this appointment.'}
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
          Back to Appointments
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Create Medical Report
        </Typography>
      </Box>

      <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <EventIcon sx={{ mr: 1 }} />
            Appointment Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center">
                <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>
                  <strong>Patient:</strong> {appointmentData.patientFirstName} {appointmentData.patientLastName}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center">
                <EventIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>
                  <strong>Date:</strong> {new Date(appointmentData.appointmentStart).toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center">
                <LocalHospitalIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>
                  <strong>Time:</strong> {new Date(appointmentData.appointmentStart).toLocaleTimeString()} - {new Date(appointmentData.appointmentEnd).toLocaleTimeString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Medical Report Form
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
              Diagnosis Information
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
                  label="Diagnosis Made"
                  sx={{ mb: 1 }}
                />
              </Grid>
              
              {formData.diagnosisMade && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Diagnosis Name"
                      value={formData.diagnosisName}
                      onChange={handleChange('diagnosisName')}
                      required
                      placeholder="e.g., Hypertension, Diabetes Type 2, Upper Respiratory Infection"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Diagnosis Details"
                      value={formData.diagnosisDetails}
                      onChange={handleChange('diagnosisDetails')}
                      multiline
                      rows={3}
                      placeholder="Detailed description of the diagnosis, symptoms observed, and clinical findings"
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>

          <Box mb={3}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              Examination Report
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TextField
              fullWidth
              label="Report Content"
              value={formData.reportContent}
              onChange={handleChange('reportContent')}
              multiline
              rows={6}
              required
              placeholder="Detailed examination findings, treatment provided, medications prescribed, recommendations, and follow-up instructions"
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
              Referral Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.referralNeeded}
                  onChange={handleChange('referralNeeded')}
                />
              }
              label="Referral Required"
              sx={{ mb: 2 }}
            />

            {formData.referralNeeded && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Referral Specialty"
                    value={formData.referralSpecialty}
                    onChange={handleChange('referralSpecialty')}
                    placeholder="e.g., Cardiology, Dermatology, Orthopedics"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DoctorAutocomplete
                    value={formData.referralDoctorName}
                    onChange={handleReferralDoctorChange}
                    specialty={formData.referralSpecialty}
                    label="Referred Doctor Name"
                    placeholder="Search for a doctor or enter manually"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Referral Message"
                    value={formData.referralMessage}
                    onChange={handleChange('referralMessage')}
                    multiline
                    rows={3}
                    placeholder="Additional information for the specialist"
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
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading}
              sx={{ minWidth: 150 }}
            >
              {loading ? 'Creating...' : 'Create Report'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}
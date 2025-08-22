import { useState, useCallback, useEffect } from 'react';
import { reportsService } from '../services';
import { validateReportForm } from '../utils';

export const useReportForm = (initialData = {}) => {
  const [formData, setFormData] = useState({
    diagnosisName: '',
    diagnosisDetails: '',
    diagnosisMade: false,
    reportContent: '',
    referralNeeded: false,
    medications: [],
    referralSpecialty: '',
    referralDoctorName: '',
    referralMessage: '',
    ...initialData
  });

  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prevData => {
        const updatedData = { ...prevData, ...initialData };
        
        if (initialData.medications && Array.isArray(initialData.medications)) {
          updatedData.medications = initialData.medications.map((med, index) => ({
            id: med.id || Date.now() + index,
            medicationName: med.medicationName || med.medication_name || '',
            dosage: med.dosage || '',
            frequency: med.frequency || '',
            duration: med.duration || '',
            instructions: med.instructions || ''
          }));
        }
        
        return updatedData;
      });
    }
  }, [initialData]);


  const addMedication = useCallback(() => {
    const newMedication = {
      id: Date.now(),
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    };
    
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, newMedication]
    }));
  }, []);

  const updateMedication = useCallback((medicationId, field, value) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map(med => 
        med.id === medicationId ? { ...med, [field]: value } : med
      )
    }));
    
    if (success) setSuccess('');
  }, [success]);

  const removeMedication = useCallback((medicationId) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter(med => med.id !== medicationId)
    }));
  }, []);


  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (success) setSuccess('');
  }, [success]);

  const handleChange = useCallback((field) => (event) => {
    const value = event.target.type === 'checkbox' 
      ? event.target.checked 
      : event.target.value;
    
    updateField(field, value);
  }, [updateField]);

  const handleReferralDoctorChange = useCallback((value) => {
    updateField('referralDoctorName', value);
  }, [updateField]);

  const validateForm = useCallback(() => {
    const validation = validateReportForm(formData);
    setErrors(validation.errors);
    setWarnings(validation.warnings);
    return validation.isValid;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      diagnosisName: '',
      diagnosisDetails: '',
      diagnosisMade: false,
      reportContent: '',
      referralNeeded: false,
      medications: [],
      referralSpecialty: '',
      referralDoctorName: '',
      referralMessage: '',
      ...initialData
    });
    setErrors([]);
    setWarnings([]);
    setSuccess('');
  }, [initialData]);

  const submitForm = useCallback(async (appointmentId, doctorId, patientId, appointmentData = {}) => {
    if (!validateForm()) {
      return false;
    }

    setLoading(true);
    setSuccess('');

    try {
      const reportData = {
        ...formData,
        patientFirstName: appointmentData.patientFirstName || appointmentData.patient_first_name || 'Unknown',
        patientLastName: appointmentData.patientLastName || appointmentData.patient_last_name || 'Patient',
        doctorFirstName: appointmentData.doctorFirstName || appointmentData.doctor_first_name || 'Dr.',
        doctorLastName: appointmentData.doctorLastName || appointmentData.doctor_last_name || 'Unknown'
      };
          
      await reportsService.createReport(reportData, appointmentId, doctorId, patientId);
      setSuccess('Medical report created successfully!');
      return true;
    } catch (error) {
      setErrors([error.message]);
      return false;
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm]);

  const updateReport = useCallback(async (reportId) => {
    if (!validateForm()) {
      return false;
    }

    setLoading(true);
    setSuccess('');

    try {
      await reportsService.updateReport(reportId, formData);
      setSuccess('Medical report updated successfully!');
      return true;
    } catch (error) {
      setErrors([error.message]);
      return false;
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm]);

  const clearMessages = useCallback(() => {
    setErrors([]);
    setWarnings([]);
    setSuccess('');
  }, []);

  return {
    formData,
    errors,
    warnings,
    loading,
    success,
    isValid: errors.length === 0,
    hasWarnings: warnings.length > 0,
    updateField,
    handleChange,
    handleReferralDoctorChange,
    validateForm,
    resetForm,
    submitForm,
    updateReport,
    clearMessages,
    addMedication,
    updateMedication,
    removeMedication
  };
};

export default useReportForm;

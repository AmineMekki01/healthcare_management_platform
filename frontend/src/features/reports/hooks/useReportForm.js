import { useState, useCallback, useEffect } from 'react';
import i18n from '../../../i18n';
import { reportsService } from '../services';
import { validateReportForm } from '../utils';
import { normalizeSpecialtyCode } from '../../../utils/specialties';

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
    referralDoctorId: null,
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


        if (Object.prototype.hasOwnProperty.call(initialData, 'referralSpecialty')) {
          updatedData.referralSpecialty = normalizeSpecialtyCode(initialData.referralSpecialty);
        }
        
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
    if (value && typeof value === 'object') {
      const isArabic = (i18n.language || '').startsWith('ar');
      const firstName = value.firstName || value.first_name || '';
      const lastName = value.lastName || value.last_name || '';
      const firstNameAr = value.firstNameAr || value.first_name_ar || '';
      const lastNameAr = value.lastNameAr || value.last_name_ar || '';

      const arFull = [firstNameAr, lastNameAr].filter(Boolean).join(' ').trim();
      const enFull = [firstName, lastName].filter(Boolean).join(' ').trim();

      const fullName = (isArabic && arFull)
        ? arFull
        : (value.fullName || value.full_name || enFull || arFull || '').trim();
      updateField('referralDoctorName', fullName);
      updateField('referralDoctorId', value.doctorId || null);
      return;
    }
    updateField('referralDoctorName', value);
    updateField('referralDoctorId', null);
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
      referralDoctorId: null,
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
        patientFirstName: appointmentData.patientFirstName || appointmentData.patient_first_name || i18n.t('reports:defaults.unknown'),
        patientLastName: appointmentData.patientLastName || appointmentData.patient_last_name || i18n.t('reports:defaults.patient'),
        doctorFirstName: appointmentData.doctorFirstName || appointmentData.doctor_first_name || i18n.t('reports:defaults.unknown'),
        doctorLastName: appointmentData.doctorLastName || appointmentData.doctor_last_name || i18n.t('reports:defaults.doctor')
      };
          
      await reportsService.createReport(reportData, appointmentId, doctorId, patientId);
      setSuccess(i18n.t('reports:messages.createSuccess'));
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
      setSuccess(i18n.t('reports:messages.updateSuccess'));
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

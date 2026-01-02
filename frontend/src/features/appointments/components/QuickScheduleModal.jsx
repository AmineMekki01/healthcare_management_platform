import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Close, Person, AccessTime, Event } from '@mui/icons-material';
import appointmentService from '../services/appointmentService';
import receptionistPatientService from '../../receptionist/services/receptionistPatientService';
import { formatAppointmentTime, getLocalizedFullName } from '../utils/appointmentI18n';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  margin: 0;
  color: #2d3748;
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #a0aec0;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background: #f7fafc;
    color: #2d3748;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 500;
  font-size: 0.9rem;

  svg {
    font-size: 1.2rem;
    color: #667eea;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  box-sizing: border-box;
  background: white;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const TimeSummary = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  border-radius: 8px;
  color: white;
  margin-bottom: 1.5rem;
`;

const TimeRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 0.5rem 0;
  font-size: 0.95rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button`
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: #f7fafc;
  color: #4a5568;

  &:hover:not(:disabled) {
    background: #e2e8f0;
  }
`;

const CreateButton = styled(Button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
`;

const ErrorMessage = styled.div`
  background: #fed7d7;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const QuickScheduleModal = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  selectedTime, 
  doctorId,
  creatorType,
  patients = [],
  loading: loadingPatients = false,
  onSuccess 
}) => {
  const { t, i18n } = useTranslation('appointments');
  const [formData, setFormData] = useState({
    patientId: '',
    duration: 30,
    appointmentType: 'consultation',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [endTime, setEndTime] = useState('');

  const getPatientLabel = (patient) => {
    const label = getLocalizedFullName(
      {
        firstName: patient?.firstName || patient?.first_name,
        lastName: patient?.lastName || patient?.last_name,
        firstNameAr: patient?.firstNameAr || patient?.first_name_ar,
        lastNameAr: patient?.lastNameAr || patient?.last_name_ar,
        fullName: patient?.name,
      },
      i18n.language
    );

    return label || t('quickSchedule.unknownPatient');
  };

  useEffect(() => {
    if (selectedDate && selectedTime && formData.duration) {
      const [hours, minutes] = selectedTime.split(':');
      const start = new Date(selectedDate);
      start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const end = new Date(start.getTime() + formData.duration * 60000);
      setEndTime(formatAppointmentTime(end, i18n.language));
    }
  }, [selectedDate, selectedTime, formData.duration, i18n.language]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.patientId) {
      setError(t('quickSchedule.selectPatient'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [hours, minutes] = selectedTime.split(':');
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const isReceptionistCreator = creatorType === 'receptionist';
      const isDoctorCreator = creatorType === 'doctor';

      if (isDoctorCreator && !doctorId) {
        setError(t('quickSchedule.createError'));
        return;
      }

      if (isReceptionistCreator) {
        const appointmentEndDate = new Date(appointmentDate.getTime() + formData.duration * 60000);
        await receptionistPatientService.createAppointment({
          patientId: formData.patientId,
          doctorId: doctorId || localStorage.getItem('assignedDoctorId'),
          appointmentStart: appointmentDate.toISOString(),
          appointmentEnd: appointmentEndDate.toISOString(),
          appointmentType: formData.appointmentType,
          notes: formData.notes,
          title: formData.appointmentType || 'consultation'
        });
      } else {
        const appointmentData = {
          patientId: formData.patientId,
          doctorId: doctorId,
          appointmentStart: appointmentDate.toISOString(),
          duration: formData.duration,
          appointmentType: formData.appointmentType,
          notes: formData.notes,
          isDoctorPatient: false
        };

        await appointmentService.createAppointment(appointmentData);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || t('quickSchedule.createError'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (date) => {
    try {
      return new Intl.DateTimeFormat(i18n.language || undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(new Date(date));
    } catch {
      return new Date(date).toLocaleDateString(i18n.language || undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatSelectedStartTime = () => {
    if (!selectedDate || !selectedTime) return selectedTime;
    const [hours, minutes] = selectedTime.split(':');
    const start = new Date(selectedDate);
    start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return formatAppointmentTime(start, i18n.language);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>{t('quickSchedule.title')} - {formatDate(selectedDate)}, {formatSelectedStartTime()}</Title>
          <CloseButton onClick={onClose}>
            <Close />
          </CloseButton>
        </ModalHeader>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>
              <Person />
              {t('quickSchedule.patient')}
            </Label>
            <Select
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              required
              disabled={loadingPatients}
            >
              <option value="">
                {loadingPatients 
                  ? t('quickSchedule.loadingPatients') 
                  : patients.length === 0 
                    ? t('quickSchedule.noPatientsAvailable') 
                    : t('quickSchedule.selectPatientPlaceholder')
                }
              </option>
              {patients.map(patient => (
                <option key={patient.patientId || patient.patient_id} value={patient.patientId || patient.patient_id}>
                  {getPatientLabel(patient)}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>
              <AccessTime />
              {t('quickSchedule.duration')}
            </Label>
            <Select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
            >
              <option value={15}>15 {t('quickSchedule.minutes')}</option>
              <option value={30}>30 {t('quickSchedule.minutes')}</option>
              <option value={45}>45 {t('quickSchedule.minutes')}</option>
              <option value={60}>60 {t('quickSchedule.minutes')}</option>
              <option value={90}>90 {t('quickSchedule.minutes')}</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>
              <Event />
              {t('quickSchedule.type')}
            </Label>
            <Select
              name="appointmentType"
              value={formData.appointmentType}
              onChange={handleChange}
            >
              <option value="consultation">{t('quickSchedule.types.consultation')}</option>
              <option value="followup">{t('quickSchedule.types.followup')}</option>
              <option value="checkup">{t('quickSchedule.types.checkup')}</option>
              <option value="emergency">{t('quickSchedule.types.emergency')}</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>{t('quickSchedule.notes')}</Label>
            <TextArea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder={t('quickSchedule.notesPlaceholder')}
            />
          </FormGroup>

          <TimeSummary>
            <TimeRow>
              <strong>{t('quickSchedule.start')}:</strong>
              <span>{formatSelectedStartTime()}</span>
            </TimeRow>
            <TimeRow>
              <strong>{t('quickSchedule.end')}:</strong>
              <span>{endTime}</span>
            </TimeRow>
          </TimeSummary>

          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>
              {t('common:buttons.cancel')}
            </CancelButton>
            <CreateButton type="submit" disabled={loading}>
              {loading ? t('common:status.loading') : t('quickSchedule.create')}
            </CreateButton>
          </ButtonGroup>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default QuickScheduleModal;

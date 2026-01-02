import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTime24HHmm } from '../utils/appointmentI18n';
import styled from 'styled-components';
import { Close, Event, AccessTime, Block, Repeat } from '@mui/icons-material';
import calendarEventService from '../services/calendarEventService';

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
  max-width: 550px;
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

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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

const TimeRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f7fafc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #edf2f7;
  }

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const RecurringSection = styled.div`
  background: #f7fafc;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 0.5rem;
`;

const DaySelector = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const DayButton = styled.button`
  padding: 0.5rem;
  border: 2px solid ${props => props.$selected ? '#667eea' : '#e2e8f0'};
  background: ${props => props.$selected ? '#667eea' : 'white'};
  color: ${props => props.$selected ? 'white' : '#4a5568'};
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    border-color: #667eea;
  }
`;

const ColorPicker = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const ColorOption = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid ${props => props.$selected ? '#2d3748' : 'transparent'};
  background: ${props => props.$color};
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: scale(1.1);
  }
`;

const WarningBox = styled.div`
  background: #fef5e7;
  border-left: 4px solid #f39c12;
  padding: 0.75rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-size: 0.9rem;
  color: #7d6608;
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

const PersonalEventModal = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  selectedTime, 
  doctorId,
  onSuccess 
}) => {
  const { t } = useTranslation('appointments');
  const [formData, setFormData] = useState({
    title: '',
    eventType: 'personal',
    startTime: selectedTime || '09:00',
    endTime: '',
    blocksAppointments: false,
    recurringPattern: 'none',
    recurringDays: [],
    recurringEndDate: '',
    description: '',
    color: '#FFB84D'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(':');
      const start = new Date();
      start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const end = new Date(start.getTime() + 60 * 60000); // Default 1 hour
      setFormData(prev => ({
        ...prev,
        startTime: selectedTime,
        endTime: formatTime24HHmm(end)
      }));
    }
  }, [selectedTime]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(day)
        ? prev.recurringDays.filter(d => d !== day)
        : [...prev.recurringDays, day]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError(t('personalEvent.titleRequired'));
      return;
    }

    if (formData.recurringPattern === 'weekly' && formData.recurringDays.length === 0) {
      setError(t('personalEvent.selectDays'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const eventDate = new Date(selectedDate);
      const [startHours, startMinutes] = formData.startTime.split(':');
      const [endHours, endMinutes] = formData.endTime.split(':');
      
      const startDateTime = new Date(eventDate);
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
      
      const endDateTime = new Date(eventDate);
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

      const eventData = {
        title: formData.title,
        eventType: formData.eventType,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        blocksAppointments: formData.blocksAppointments,
        description: formData.description,
        color: formData.color,
        recurringPattern: formData.recurringPattern !== 'none' ? {
          pattern: formData.recurringPattern,
          daysOfWeek: formData.recurringPattern === 'weekly' ? formData.recurringDays : undefined,
          endDate: formData.recurringEndDate || undefined
        } : null
      };

      await calendarEventService.createPersonalEvent(doctorId, eventData);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('personalEvent.createError'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const colors = [
    { value: '#FFB84D', label: 'Orange' },
    { value: '#F56565', label: 'Red' },
    { value: '#48BB78', label: 'Green' },
    { value: '#4299E1', label: 'Blue' },
    { value: '#9F7AEA', label: 'Purple' }
  ];

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>{t('personalEvent.title')}</Title>
          <CloseButton onClick={onClose}>
            <Close />
          </CloseButton>
        </ModalHeader>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>
              <Event />
              {t('personalEvent.eventTitle')}
            </Label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('personalEvent.titlePlaceholder')}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>{t('personalEvent.eventType')}</Label>
            <Select
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
            >
              <option value="personal">{t('personalEvent.types.personal')}</option>
              <option value="blocked">{t('personalEvent.types.blocked')}</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>
              <AccessTime />
              {t('personalEvent.time')}
            </Label>
            <TimeRow>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '0.25rem', display: 'block' }}>
                  {t('personalEvent.start')}
                </label>
                <Input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '0.25rem', display: 'block' }}>
                  {t('personalEvent.end')}
                </label>
                <Input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </TimeRow>
          </FormGroup>

          <FormGroup>
            <CheckboxLabel>
              <input
                type="checkbox"
                name="blocksAppointments"
                checked={formData.blocksAppointments}
                onChange={handleChange}
              />
              <Block style={{ fontSize: '1.2rem', color: '#f56565' }} />
              <span>{t('personalEvent.blockAppointments')}</span>
            </CheckboxLabel>
          </FormGroup>

          {formData.blocksAppointments && (
            <WarningBox>
              ⚠️ {t('personalEvent.blockWarning')}
            </WarningBox>
          )}

          <FormGroup>
            <Label>
              <Repeat />
              {t('personalEvent.recurring')}
            </Label>
            <Select
              name="recurringPattern"
              value={formData.recurringPattern}
              onChange={handleChange}
            >
              <option value="none">{t('personalEvent.recurringTypes.none')}</option>
              <option value="daily">{t('personalEvent.recurringTypes.daily')}</option>
              <option value="weekly">{t('personalEvent.recurringTypes.weekly')}</option>
              <option value="monthly">{t('personalEvent.recurringTypes.monthly')}</option>
            </Select>

            {formData.recurringPattern === 'weekly' && (
              <RecurringSection>
                <label style={{ fontSize: '0.9rem', color: '#4a5568', fontWeight: 500 }}>
                  {t('personalEvent.selectDays')}:
                </label>
                <DaySelector>
                  {dayNames.map((day, index) => (
                    <DayButton
                      key={day}
                      type="button"
                      $selected={formData.recurringDays.includes(index + 1)}
                      onClick={() => handleDayToggle(index + 1)}
                    >
                      {day}
                    </DayButton>
                  ))}
                </DaySelector>
              </RecurringSection>
            )}

            {formData.recurringPattern !== 'none' && (
              <RecurringSection style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.9rem', color: '#4a5568', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>
                  {t('personalEvent.endDate')} ({t('personalEvent.optional')}):
                </label>
                <Input
                  type="date"
                  name="recurringEndDate"
                  value={formData.recurringEndDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </RecurringSection>
            )}
          </FormGroup>

          <FormGroup>
            <Label>{t('personalEvent.color')}</Label>
            <ColorPicker>
              {colors.map(color => (
                <ColorOption
                  key={color.value}
                  type="button"
                  $color={color.value}
                  $selected={formData.color === color.value}
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  title={color.label}
                />
              ))}
            </ColorPicker>
          </FormGroup>

          <FormGroup>
            <Label>{t('personalEvent.description')}</Label>
            <TextArea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('personalEvent.descriptionPlaceholder')}
            />
          </FormGroup>

          <ButtonGroup>
            <CancelButton type="button" onClick={onClose}>
              {t('common:buttons.cancel')}
            </CancelButton>
            <CreateButton type="submit" disabled={loading}>
              {loading ? t('common:status.loading') : t('personalEvent.create')}
            </CreateButton>
          </ButtonGroup>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default PersonalEventModal;

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { userService } from '../services/userService';
import calendarEventService from '../../appointments/services/calendarEventService';
import axios from '../../../components/axiosConfig';

const BookingContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-top: 24px;
`;

const BookingHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
`;

const BookingTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
`;

const BookingGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CalendarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TimeSlotSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
`;

const DatePicker = styled.input`
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const TimeSlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
`;

const TimeSlot = styled.button`
  padding: 12px 8px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #2d3748;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #667eea;
    background: #667eea05;
  }
  
  ${props => props.$selected && `
    background: #667eea;
    color: white;
    border-color: #667eea;
  `}
  
  ${props => props.$disabled && `
    background: #f7fafc;
    color: #a0aec0;
    cursor: not-allowed;
    border-color: #e2e8f0;
    
    &:hover {
      background: #f7fafc;
      border-color: #e2e8f0;
    }
  `}
`;

const BookingForm = styled.div`
  grid-column: 1 / -1;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FormLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const FormInput = styled.input`
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const FormTextarea = styled.textarea`
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const BookingActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const BookingButton = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  
  ${props => props.$variant === 'primary' && `
    background: #667eea;
    border-color: #667eea;
    color: white;
    
    &:hover {
      background: #5a67d8;
      border-color: #5a67d8;
    }
    
    &:disabled {
      background: #a0aec0;
      border-color: #a0aec0;
      cursor: not-allowed;
    }
  `}
  
  ${props => props.$variant === 'secondary' && `
    background: transparent;
    border-color: #e2e8f0;
    color: #64748b;
    
    &:hover {
      background: #f8fafc;
      border-color: #cbd5e0;
    }
  `}
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: #64748b;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const SuccessMessage = styled.div`
  background: #f0fff4;
  border: 1px solid #9ae6b4;
  color: #276749;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const BookingTypeSection = styled.div`
  margin-bottom: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
`;

const BookingTypeOptions = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 12px;
`;

const BookingTypeOption = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #667eea;
    background: #667eea05;
  }
  
  ${props => props.$selected && `
    border-color: #667eea;
    background: #667eea10;
  `}
`;

const BookingTypeRadio = styled.input`
  margin: 0;
`;

const BookingTypeLabel = styled.span`
  font-weight: 500;
  color: #2d3748;
`;

const UserInfoDisplay = styled.div`
  background: #e6fffa;
  border: 1px solid #81e6d9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const UserInfoText = styled.p`
  margin: 0;
  color: #234e52;
  font-size: 14px;
`;

const InfoBox = styled.div`
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const InfoText = styled.p`
  margin: 0;
  font-size: 13px;
  color: #1e40af;
  line-height: 1.5;
  
  &:not(:last-child) {
    margin-bottom: 6px;
  }
`;

const InfoTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #1e3a8a;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
`;


const AppointmentBooking = ({ doctorId, doctor, currentUser, onBookingComplete }) => {
  const { t } = useTranslation('userManagement');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookingFor, setBookingFor] = useState('self');
  const [bookingData, setBookingData] = useState({
    patientName: currentUser?.userFullName || '',
    patientEmail: currentUser?.email || '',
    patientPhone: currentUser?.phone || '',
    title: '',
    notes: ''
  });

  const formatDateOnlyLocal = (dt) => {
    const d = dt instanceof Date ? dt : new Date(dt);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const parseDateOnlyLocal = (dateStr) => {
    const raw = String(dateStr || '').trim();
    if (!raw) return null;
    const parts = raw.split('-').map((p) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
    const [y, m, d] = parts;
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const getWeekdayName = (dateStr) => {
    const d = parseDateOnlyLocal(dateStr);
    if (!d) return '';
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const today = formatDateOnlyLocal(new Date());

  const fetchAvailableSlots = useCallback(async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    setError('');
    try {
      const startDateStr = selectedDate;
      const endDateStr = selectedDate;

      let duration = 30;
      try {
        const weekdayName = getWeekdayName(selectedDate);
        const res = await axios.get(`/api/v1/doctors/${doctorId}/weekly_schedule`, {
          params: { start: selectedDate, end: selectedDate },
        });
        const weeklySchedule = Array.isArray(res.data?.weeklySchedule) ? res.data.weeklySchedule : [];
        const entry = weeklySchedule.find((e) => e?.weekday === weekdayName);
        if (entry?.enabled && Number(entry?.slotDuration) > 0) {
          duration = Number(entry.slotDuration);
        }
      } catch (e) {
      }
      
      const response = await calendarEventService.findAvailableSlots(
        doctorId,
        startDateStr,
        endDateStr,
        duration,
        50
      );
      
      console.log('Calendar-aware available slots:', response);
      
      const slots = (response.slots || []).map(slot => ({
        id: slot.startTime,
        time: new Date(slot.startTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: true
      }));
      
      setAvailableSlots(slots);
      
      if (slots.length === 0) {
        setError(t('appointmentBooking.messages.noSlots'));
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setError(t('appointmentBooking.messages.slotsFailed'));
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId, selectedDate, t]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate, fetchAvailableSlots]);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
  };

  const handleInputChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBookingTypeChange = (type) => {
    setBookingFor(type);
    if (type === 'self') {
      setBookingData(prev => ({
        ...prev,
        patientName: currentUser?.userFullName || '',
        patientEmail: currentUser?.email || '',
        patientPhone: currentUser?.phone || ''
      }));
    } else {
      setBookingData(prev => ({
        ...prev,
        patientName: '',
        patientEmail: '',
        patientPhone: ''
      }));
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot || !bookingData.title) {
      setError(t('appointmentBooking.messages.fillRequired'));
      return;
    }

    if (bookingFor === 'other' && (!bookingData.patientName || !bookingData.patientEmail)) {
      setError(t('appointmentBooking.messages.providePatientInfo'));
      return;
    }

    if (!currentUser?.userId) {
      setError(t('appointmentBooking.messages.loginRequired'));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {

      let isDoctorPatient = false;
      if (bookingFor === 'self' && currentUser.userType === 'doctor') {
          isDoctorPatient = true; 
      }
      const appointmentData = {
        doctorId,
        date: selectedDate,
        time: selectedTimeSlot.time,
        availabilityId: selectedTimeSlot.availabilityId,
        title: bookingData.title,
        notes: bookingData.notes,
        patientId: bookingFor === 'self' ? currentUser.userId : null,
        patientName: bookingFor === 'self' ? currentUser.userFullName : bookingData.patientName,
        patientEmail: bookingFor === 'self' ? currentUser.email : bookingData.patientEmail,
        patientPhone: bookingFor === 'self' ? currentUser.phone : bookingData.patientPhone,
        isDoctorPatient: isDoctorPatient
      };

      const result = await userService.createAppointment(appointmentData);
      const successMessage = bookingFor === 'self' 
        ? t('appointmentBooking.messages.successSelf')
        : t('appointmentBooking.messages.successOther', { name: bookingData.patientName });
      setSuccess(successMessage);
      
      setSelectedDate('');
      setSelectedTimeSlot(null);
      setBookingFor('self');
      setBookingData({
        patientName: currentUser?.userFullName || '',
        patientEmail: currentUser?.email || '',
        patientPhone: currentUser?.phone || '',
        title: '',
        notes: ''
      });

      if (onBookingComplete) {
        onBookingComplete(result);
      }
    } catch (error) {
      console.error('Booking error:', error);
      setError(error.response?.data?.error || t('appointmentBooking.messages.bookingFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedDate('');
    setSelectedTimeSlot(null);
    setError('');
    setSuccess('');
    setBookingFor('self');
    setBookingData({
      patientName: currentUser?.userFullName || '',
      patientEmail: currentUser?.email || '',
      patientPhone: currentUser?.phone || '',
      title: '',
      notes: ''
    });
  };

  return (
    <BookingContainer>
      <BookingHeader>
        <BookingTitle>{t('appointmentBooking.title')}</BookingTitle>
      </BookingHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <BookingGrid>
        <CalendarSection>
          <SectionTitle>{t('appointmentBooking.sections.selectDate')}</SectionTitle>
          <DatePicker
            type="date"
            value={selectedDate}
            min={today}
            onChange={handleDateChange}
          />
        </CalendarSection>

        <TimeSlotSection>
          <SectionTitle>{t('appointmentBooking.sections.availableSlots')}</SectionTitle>
        
          {loading ? (
            <LoadingMessage>{t('appointmentBooking.messages.loading')}</LoadingMessage>
          ) : (
            <TimeSlotGrid>
              {availableSlots.map((slot) => (
                <TimeSlot
                  key={slot.id}
                  $selected={selectedTimeSlot?.id === slot.id}
                  $disabled={slot.isBooked}
                  onClick={() => !slot.isBooked && handleTimeSlotSelect(slot)}
                >
                  {slot.time}
                </TimeSlot>
              ))}
              {selectedDate && availableSlots.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b' }}>
                  {t('appointmentBooking.messages.noSlots')}
                </div>
              )}
            </TimeSlotGrid>
          )}
        </TimeSlotSection>
      </BookingGrid>

        {selectedTimeSlot && (
        <BookingForm>
          <BookingTypeSection>
            <SectionTitle>{t('appointmentBooking.sections.bookingFor')}</SectionTitle>
            <BookingTypeOptions>
              <BookingTypeOption $selected={bookingFor === 'self'}>
                <BookingTypeRadio
                  type="radio"
                  name="bookingFor"
                  value="self"
                  checked={bookingFor === 'self'}
                  onChange={() => handleBookingTypeChange('self')}
                />
                <BookingTypeLabel>{t('appointmentBooking.bookingType.self')}</BookingTypeLabel>
              </BookingTypeOption>
              <BookingTypeOption $selected={bookingFor === 'other'}>
                <BookingTypeRadio
                  type="radio"
                  name="bookingFor"
                  value="other"
                  checked={bookingFor === 'other'}
                  onChange={() => handleBookingTypeChange('other')}
                />
                <BookingTypeLabel>{t('appointmentBooking.bookingType.other')}</BookingTypeLabel>
              </BookingTypeOption>
            </BookingTypeOptions>
          </BookingTypeSection>

          {bookingFor === 'self' && (
            <UserInfoDisplay>
              <UserInfoText>
                {t('appointmentBooking.messages.bookingFor', { name: currentUser?.userFullName })}
              </UserInfoText>
              <UserInfoText>Email: {currentUser?.email}</UserInfoText>
              {currentUser?.phone && <UserInfoText>Phone: {currentUser?.phone}</UserInfoText>}
            </UserInfoDisplay>
          )}

          {bookingFor === 'other' && (
            <>
              <SectionTitle>{t('appointmentBooking.sections.patientInfo')}</SectionTitle>
              <FormGrid>
                <FormGroup>
                  <FormLabel>{t('appointmentBooking.fields.patientName')} *</FormLabel>
                  <FormInput
                    type="text"
                    value={bookingData.patientName}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                    placeholder={t('appointmentBooking.placeholders.patientName')}
                  />
                </FormGroup>
                
                <FormGroup>
                  <FormLabel>{t('appointmentBooking.fields.email')} *</FormLabel>
                  <FormInput
                    type="email"
                    value={bookingData.patientEmail}
                    onChange={(e) => handleInputChange('patientEmail', e.target.value)}
                    placeholder={t('appointmentBooking.placeholders.email')}
                  />
                </FormGroup>
                
                <FormGroup>
                  <FormLabel>{t('appointmentBooking.fields.phoneNumber')}</FormLabel>
                  <FormInput
                    type="tel"
                    value={bookingData.patientPhone}
                    onChange={(e) => handleInputChange('patientPhone', e.target.value)}
                    placeholder={t('appointmentBooking.placeholders.phoneNumber')}
                  />
                </FormGroup>
              </FormGrid>
            </>
          )}
          
          <SectionTitle>{t('appointmentBooking.sections.appointmentDetails')}</SectionTitle>
          <FormGrid>
            <FormGroup>
              <FormLabel>{t('appointmentBooking.fields.reasonForVisit')} *</FormLabel>
              <FormInput
                type="text"
                value={bookingData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={t('appointmentBooking.placeholders.reasonForVisit')}
              />
            </FormGroup>
          </FormGrid>
          
          <FormGroup>
            <FormLabel>{t('appointmentBooking.fields.additionalNotes')}</FormLabel>
            <FormTextarea
              value={bookingData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder={t('appointmentBooking.placeholders.additionalNotes')}
            />
          </FormGroup>

          <BookingActions>
            <BookingButton $variant="secondary" onClick={handleCancel}>
              {t('appointmentBooking.buttons.cancel')}
            </BookingButton>
            <BookingButton 
              $variant="primary" 
              onClick={handleBookAppointment}
              disabled={loading || !bookingData.title}
            >
              {loading ? t('appointmentBooking.buttons.booking') : t('appointmentBooking.buttons.bookAppointment')}
            </BookingButton>
          </BookingActions>
        </BookingForm>
      )}
    </BookingContainer>
  );
};

export default AppointmentBooking;

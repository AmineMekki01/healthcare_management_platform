import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Clock, User, MapPin, FileText, Repeat, Trash2 } from 'lucide-react';
import {
  formatAppointmentDate,
  formatAppointmentTime,
  getDoctorPrefix,
  getLocalizedDoctorName,
  getLocalizedPatientName,
} from '../utils/appointmentI18n';

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
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: ${props => props.$eventColor || '#667eea'};
  border-radius: 16px 16px 0 0;
  color: white;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  flex: 1;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const EventType = styled.div`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  background: ${props => props.$eventColor ? `${props.$eventColor}20` : '#667eea20'};
  color: ${props => props.$eventColor || '#667eea'};
`;

const InfoSection = styled.div`
  margin-bottom: 24px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f7fafc;
  border-radius: 8px;
`;

const InfoIcon = styled.div`
  color: #667eea;
  flex-shrink: 0;
  margin-top: 2px;
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoLabel = styled.div`
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.div`
  font-size: 16px;
  color: #1e293b;
  font-weight: 500;
`;

const ClickableName = styled.span`
  color: #667eea;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  
  &:hover {
    color: #5568d3;
    text-decoration: underline;
  }
`;

const Description = styled.p`
  color: #475569;
  line-height: 1.6;
  margin: 0;
`;

const RecurringBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  margin-top: 12px;
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;

  ${props => props.$variant === 'danger' ? `
    background: #ef4444;
    color: white;
    
    &:hover {
      background: #dc2626;
    }
  ` : `
    background: #e2e8f0;
    color: #475569;
    
    &:hover {
      background: #cbd5e1;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ConfirmDialog = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
`;

const ConfirmText = styled.p`
  margin: 0 0 12px 0;
  color: #991b1b;
  font-size: 14px;
`;

const ConfirmActions = styled.div`
  display: flex;
  gap: 8px;
`;

const EventDetailsModal = ({ event, onClose, onDelete }) => {
  const { t, i18n } = useTranslation('appointments');
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!event) return null;

  const isAppointment = !event.isPersonalEvent && (event.appointmentId || event.appointmentStart);
  const isRecurring = event.recurringPattern && Object.keys(event.recurringPattern).length > 0;

  const doctorPrefix = getDoctorPrefix(i18n.language);
  const doctorName = event.doctorName || (() => {
    const localized = getLocalizedDoctorName(event, i18n.language);
    return localized ? `${doctorPrefix} ${localized}` : null;
  })();

  const patientName = event.patientName || (() => {
    const localized = getLocalizedPatientName(event, i18n.language);
    return localized || null;
  })();

  const eventTypeKey = isAppointment ? 'appointment' : (event.eventType || 'personal');
  const eventTypeLabel = t(`calendar.eventTypes.${eventTypeKey}`);

  const getRecurringText = () => {
    if (!isRecurring) return '';
    
    const pattern = event.recurringPattern;
    if (pattern.frequency === 'daily') return t('calendar.recurring.daily');
    if (pattern.frequency === 'weekly') {
      const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const days = (pattern.daysOfWeek || [])
        .map((d) => t(`calendar.days.${dayKeys[d]}`))
        .join(', ');
      return t('calendar.recurring.weeklyOn', { days });
    }
    if (pattern.frequency === 'monthly') return t('calendar.recurring.monthlyOn', { day: pattern.dayOfMonth });
    return t('calendar.recurring.event');
  };

  const handleDoctorClick = () => {
    if (event.doctorId) {
      navigate(`/doctor-profile/${event.doctorId}`);
      onClose();
    }
  };

  const handlePatientClick = () => {
    if (event.patientId) {
      navigate(`/patient-profile/${event.patientId}`);
      onClose();
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(event);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(t('calendar.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader $eventColor={event.color || (isAppointment ? '#667eea' : '#FFB84D')}>
          <div>
            <ModalTitle>
              {isAppointment 
                ? `${t('calendar.eventTypes.appointment')} - ${patientName || doctorName || t('calendar.labels.patient')}`
                : event.title || t('calendar.eventTypes.personal')
              }
            </ModalTitle>
            <EventType $eventColor={event.color || (isAppointment ? '#667eea' : '#FFB84D')}>
              {eventTypeLabel === `calendar.eventTypes.${eventTypeKey}` ? event.eventType || t('calendar.eventTypes.personal') : eventTypeLabel}
            </EventType>
          </div>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <InfoSection>
            <InfoRow>
              <InfoIcon>
                <Calendar size={20} />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>{t('calendar.labels.date')}</InfoLabel>
                <InfoValue>{formatAppointmentDate(event.appointmentStart || event.startDate, i18n.language)}</InfoValue>
              </InfoContent>
            </InfoRow>

            <InfoRow>
              <InfoIcon>
                <Clock size={20} />
              </InfoIcon>
              <InfoContent>
                <InfoLabel>{t('calendar.labels.time')}</InfoLabel>
                <InfoValue>
                  {formatAppointmentTime(event.appointmentStart || event.startDate, i18n.language)} - {formatAppointmentTime(event.appointmentEnd || event.endDate, i18n.language)}
                </InfoValue>
              </InfoContent>
            </InfoRow>

            {doctorName && (
              <InfoRow>
                <InfoIcon>
                  <User size={20} />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>{t('calendar.labels.doctor')}</InfoLabel>
                  <InfoValue>
                    <ClickableName onClick={handleDoctorClick}>
                      {doctorName}
                    </ClickableName>
                  </InfoValue>
                </InfoContent>
              </InfoRow>
            )}

            {patientName && (
              <InfoRow>
                <InfoIcon>
                  <User size={20} />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>{t('calendar.labels.patient')}</InfoLabel>
                  <InfoValue>
                    <ClickableName onClick={handlePatientClick}>
                      {patientName}
                    </ClickableName>
                  </InfoValue>
                </InfoContent>
              </InfoRow>
            )}

            {event.location && (
              <InfoRow>
                <InfoIcon>
                  <MapPin size={20} />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>{t('calendar.labels.location')}</InfoLabel>
                  <InfoValue>{event.location}</InfoValue>
                </InfoContent>
              </InfoRow>
            )}

            {(event.description || event.notes) && (
              <InfoRow>
                <InfoIcon>
                  <FileText size={20} />
                </InfoIcon>
                <InfoContent>
                  <InfoLabel>{t('calendar.labels.description')}</InfoLabel>
                  <Description>{event.description || event.notes}</Description>
                </InfoContent>
              </InfoRow>
            )}
          </InfoSection>

          {isRecurring && (
            <RecurringBadge>
              <Repeat size={16} />
              {getRecurringText()}
              {event.recurringPattern?.endDate && ` ${t('calendar.recurring.until', { date: formatAppointmentDate(event.recurringPattern.endDate, i18n.language) })}`}
            </RecurringBadge>
          )}

          {!isAppointment && !showDeleteConfirm && (
            <ModalFooter>
              <Button onClick={() => setShowDeleteConfirm(true)} $variant="danger">
                <Trash2 size={16} />
                {t('calendar.actions.delete')}
              </Button>
            </ModalFooter>
          )}

          {showDeleteConfirm && (
            <ConfirmDialog>
              <ConfirmText>
                {isRecurring 
                  ? t('calendar.confirmDelete.recurringMessage')
                  : t('calendar.confirmDelete.message')
                }
              </ConfirmText>
              <ConfirmActions>
                <Button 
                  onClick={handleDelete} 
                  $variant="danger"
                  disabled={deleting}
                >
                  {deleting ? t('calendar.actions.deleting') : t('calendar.actions.confirmDelete')}
                </Button>
                <Button onClick={() => setShowDeleteConfirm(false)}>
                  {t('calendar.actions.cancel')}
                </Button>
              </ConfirmActions>
            </ConfirmDialog>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EventDetailsModal;

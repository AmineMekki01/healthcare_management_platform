import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { userService } from '../services/userService';

const ManagerContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-top: 24px;
`;

const ManagerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
`;

const ManagerTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
`;

const FilterButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: ${props => props.$active ? '#667eea' : 'white'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #667eea;
    background: ${props => props.$active ? '#5a67d8' : '#667eea05'};
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const AppointmentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const AppointmentCard = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
  }
`;

const AppointmentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const AppointmentInfo = styled.div`
  flex: 1;
`;

const AppointmentDate = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 4px;
`;

const AppointmentTime = styled.div`
  font-size: 14px;
  color: #667eea;
  font-weight: 500;
`;

const PatientInfo = styled.div`
  font-size: 14px;
  color: #64748b;
  margin-top: 8px;
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  
  ${props => {
    if (props.$status === 'confirmed') return `
      background: #c6f6d5;
      color: #22543d;
    `;
    if (props.$status === 'pending') return `
      background: #fef3cd;
      color: #975a16;
    `;
    if (props.$status === 'cancelled') return `
      background: #fed7d7;
      color: #c53030;
    `;
    return `
      background: #e2e8f0;
      color: #64748b;
    `;
  }}
`;

const AppointmentActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.$variant === 'view' && `
    background: transparent;
    border: 1px solid #667eea;
    color: #667eea;
    
    &:hover {
      background: #667eea05;
    }
  `}
  
  ${props => props.$variant === 'cancel' && `
    background: transparent;
    border: 1px solid #ef4444;
    color: #ef4444;
    
    &:hover {
      background: #ef444405;
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

const EmptyMessage = styled.div`
  text-align: center;
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

const AppointmentManager = ({ doctorId, userType = 'patient', currentUserId }) => {
  const { t } = useTranslation('userManagement');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {};
      
      if (userType === 'doctor') {
        filters.doctorId = currentUserId;
      } else if (userType === 'patient') {
        filters.patientId = currentUserId;
      } else if (userType === 'receptionist') {
        filters.doctorId = doctorId;
      }

      const data = await userService.getUserAppointments(filters);
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(t('appointmentManager.messages.loading'));
    } finally {
      setLoading(false);
    }
  }, [doctorId, t, currentUserId, userType]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm(t('appointmentManager.messages.cancelSuccess'))) {
      return;
    }

    try {
      await userService.cancelAppointment({
        appointmentId,
        canceledBy: userType,
        reason: 'Cancelled by user'
      });
      
      fetchAppointments();
    } catch (error) {
      console.error('Error canceling appointment:', error);
      setError(t('appointmentManager.messages.cancelFailed'));
    }
  };

  const getAppointmentStatus = (appointment) => {
    if (appointment.canceled) return 'cancelled';
    if (new Date(appointment.appointmentStart) > new Date()) return 'confirmed';
    return 'past';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAppointments = appointments.filter(appointment => {
    const status = getAppointmentStatus(appointment);
    if (filter === 'upcoming') return status === 'confirmed';
    if (filter === 'past') return status === 'past';
    if (filter === 'cancelled') return status === 'cancelled';
    return true;
  });

  return (
    <ManagerContainer>
      <ManagerHeader>
        <ManagerTitle>{t('appointmentManager.title')}</ManagerTitle>
        <FilterGroup>
          <FilterButton 
            $active={filter === 'all'} 
            onClick={() => setFilter('all')}
          >
            {t('appointmentManager.tabs.all')}
          </FilterButton>
          <FilterButton 
            $active={filter === 'upcoming'} 
            onClick={() => setFilter('upcoming')}
          >
            {t('appointmentManager.tabs.upcoming')}
          </FilterButton>
          <FilterButton 
            $active={filter === 'past'} 
            onClick={() => setFilter('past')}
          >
            {t('appointmentManager.tabs.past')}
          </FilterButton>
          <FilterButton 
            $active={filter === 'cancelled'} 
            onClick={() => setFilter('cancelled')}
          >
            {t('appointmentManager.tabs.cancelled')}
          </FilterButton>
        </FilterGroup>
      </ManagerHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {loading ? (
        <LoadingMessage>{t('appointmentManager.messages.loading')}</LoadingMessage>
      ) : filteredAppointments.length === 0 ? (
        <EmptyMessage>
          {t('appointmentManager.messages.noAppointments')}
        </EmptyMessage>
      ) : (
        <AppointmentList>
          {filteredAppointments.map((appointment) => (
            <AppointmentCard key={appointment.appointmentId}>
              <AppointmentHeader>
                <AppointmentInfo>
                  <AppointmentDate>
                    {formatDate(appointment.appointmentStart)}
                  </AppointmentDate>
                  <AppointmentTime>
                    {formatTime(appointment.appointmentStart)} - {formatTime(appointment.appointmentEnd)}
                  </AppointmentTime>
                  <PatientInfo>
                    {userType === 'doctor' 
                      ? `Patient: ${appointment.patientFirstName} ${appointment.patientLastName}`
                      : `Dr. ${appointment.first_name} ${appointment.last_name} (${appointment.specialty})`
                    }
                  </PatientInfo>
                </AppointmentInfo>
                <StatusBadge $status={getAppointmentStatus(appointment)}>
                  {t(`appointmentManager.status.${getAppointmentStatus(appointment)}`)}
                </StatusBadge>
              </AppointmentHeader>

              <AppointmentActions>
                <ActionButton 
                  $variant="view"
                  onClick={() => {
                    console.log('View appointment:', appointment.appointmentId);
                  }}
                >
                  {t('appointmentManager.actions.viewDetails')}
                </ActionButton>
                {getAppointmentStatus(appointment) === 'confirmed' && (
                  <ActionButton 
                    $variant="cancel"
                    onClick={() => handleCancelAppointment(appointment.appointmentId)}
                  >
                    {t('appointmentManager.actions.cancel')}
                  </ActionButton>
                )}
              </AppointmentActions>
            </AppointmentCard>
          ))}
        </AppointmentList>
      )}
    </ManagerContainer>
  );
};

export default AppointmentManager;

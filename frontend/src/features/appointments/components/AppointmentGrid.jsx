import React from 'react';
import { useTranslation } from 'react-i18next';
import { Flex, EmptyState, ContentContainer, AppointmentCounter } from '../styles/appointmentStyles';
import AppointmentCard from './AppointmentCard';


const AppointmentGrid = ({ 
  appointments, 
  filteredAppointments, 
  userType, 
  activeMode, 
  tabTitle,
  activeTab,
  onAppointmentUpdate 
}) => {
  const { t } = useTranslation('appointments');
  
  const getEffectiveUserType = () => {
    return activeMode === 'patient' ? 'patient' : userType;
  };

  const getEmptyMessage = () => {
    if (appointments.length === 0) {
      return t('grid.noAppointmentsFound', { tab: t(`tabs.${activeTab}`) });
    }
    return t('grid.noMatchingAppointments');
  };

  return (
    <ContentContainer>
      <AppointmentCounter>
        {t('grid.showingAppointments', { 
          filtered: filteredAppointments.length, 
          total: appointments.length 
        })}
      </AppointmentCounter>

      {filteredAppointments.length > 0 ? (
        <Flex>
          {filteredAppointments.map(reservation => (
            <AppointmentCard
              key={reservation.appointmentId}
              reservation={reservation}
              userType={getEffectiveUserType()}
              onAppointmentUpdate={onAppointmentUpdate}
            />
          ))}
        </Flex>
      ) : (
        <EmptyState>
          {getEmptyMessage()}
        </EmptyState>
      )}
    </ContentContainer>
  );
};

export default AppointmentGrid;

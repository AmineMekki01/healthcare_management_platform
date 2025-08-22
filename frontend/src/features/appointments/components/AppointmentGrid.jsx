import React from 'react';
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
  const getEffectiveUserType = () => {
    return activeMode === 'patient' ? 'patient' : userType;
  };

  const getEmptyMessage = () => {
    if (appointments.length === 0) {
      return `No ${activeTab} appointments found`;
    }
    return 'No appointments match your search criteria';
  };

  return (
    <ContentContainer>
      <AppointmentCounter>
        Showing {filteredAppointments.length} of {appointments.length} appointments
        <span>{tabTitle}</span>
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

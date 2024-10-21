import React, { useContext } from 'react';
import AppointmentsChart from './../components/Appointments/AppointmentsChart';
import { AuthContext } from './../components/Auth/AuthContext';
import { DashboardContainer, AppointmentsWrapper, AppointmentsCard, Title } from './styles/DashboardStyles';
import { faCalendarCheck, faCalendarTimes } from '@fortawesome/free-solid-svg-icons';

export default function Dashboard() {
  const { userId, userType } = useContext(AuthContext);

  return (
    <DashboardContainer>
      <Title>Dashboard</Title>
      
      <AppointmentsWrapper>
        <AppointmentsCard>
          <AppointmentsChart 
            userId={userId} 
            userType={userType}
            appointmentType="attended"
            apiType="attended"
            label="Attended Appointments"
            icon={faCalendarCheck}
            color="#4CAF50"
            pieTitle="Attended Appointments"
          />
        </AppointmentsCard>

        <AppointmentsCard>
          <AppointmentsChart 
            userId={userId} 
            userType={userType}
            appointmentType="canceled"
            apiType="canceled"
            label="Canceled Appointments"
            icon={faCalendarTimes}
            color="#FF6F61"
            pieTitle="Canceled Appointments"
          />
        </AppointmentsCard>
      </AppointmentsWrapper>
    </DashboardContainer>
  );
}

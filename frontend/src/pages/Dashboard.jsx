import React, { useContext } from 'react';
import AttendedAppointmentsChart from './../components/Appointments/AttendedAppointmentsChart';
import CanceledAppointmentsChart from './../components/Appointments/CanceledAppointmentsChart';
import { AuthContext } from './../components/Auth/AuthContext';
import { DashboardContainer, ChartContainer, Title } from './styles/DashboardStyles';

export default function Dashboard() {
  const { userId, userType } = useContext(AuthContext);

  return (
    <DashboardContainer>
      <Title>Appointments Dashboard</Title>
      
      <ChartContainer>
        <AttendedAppointmentsChart userId={userId} userType={userType} />
      </ChartContainer>

      <ChartContainer>
        <CanceledAppointmentsChart userId={userId} userType={userType}/>
      </ChartContainer>

    </DashboardContainer>
  );
}

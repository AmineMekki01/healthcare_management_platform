import React from 'react';
import { StatsContainer, StatCard, StatNumber, StatLabel } from '../styles/appointmentStyles';

const AppointmentStats = ({ statistics, userType, activeMode }) => {
  if ((userType === 'doctor' || userType === 'receptionist') && activeMode !== 'patient') {
    return (
      <StatsContainer>
        <StatCard>
          <StatNumber color="#667eea">{statistics.totalAsDoctor || statistics.total}</StatNumber>
          <StatLabel>Total as {userType === 'doctor' ? 'Doctor' : 'Receptionist'}</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber color="#48bb78">{statistics.upcomingAsDoctor || statistics.upcoming}</StatNumber>
          <StatLabel>Upcoming as {userType === 'doctor' ? 'Doctor' : 'Receptionist'}</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber color="#9f7aea">{statistics.totalAsPatient || 0}</StatNumber>
          <StatLabel>Total as Patient</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber color="#ed8936">{statistics.upcomingAsPatient || 0}</StatNumber>
          <StatLabel>Upcoming as Patient</StatLabel>
        </StatCard>
      </StatsContainer>
    );
  }

  return (
    <StatsContainer>
      <StatCard>
        <StatNumber color="#667eea">{statistics.totalAsPatient || statistics.total}</StatNumber>
        <StatLabel>Total Appointments</StatLabel>
      </StatCard>
      <StatCard>
        <StatNumber color="#48bb78">{statistics.upcomingAsPatient || statistics.upcoming}</StatNumber>
        <StatLabel>Upcoming</StatLabel>
      </StatCard>
      <StatCard>
        <StatNumber color="#ed8936">{statistics.completedAsPatient || statistics.completed}</StatNumber>
        <StatLabel>Completed</StatLabel>
      </StatCard>
      <StatCard>
        <StatNumber color="#f56565">{statistics.canceledAsPatient || statistics.canceled}</StatNumber>
        <StatLabel>Canceled</StatLabel>
      </StatCard>
    </StatsContainer>
  );
};

export default AppointmentStats;

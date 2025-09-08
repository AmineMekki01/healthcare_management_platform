import React from 'react';
import { useTranslation } from 'react-i18next';
import { StatsContainer, StatCard, StatNumber, StatLabel } from '../styles/appointmentStyles';

const AppointmentStats = ({ statistics, userType, activeMode }) => {
  const { t } = useTranslation('appointments');
  
  if ((userType === 'doctor' || userType === 'receptionist') && activeMode !== 'patient') {
    return (
      <StatsContainer>
        <StatCard>
          <StatNumber color="#667eea">{statistics.totalAsDoctor || statistics.total}</StatNumber>
          <StatLabel>{t('stats.totalAs', { role: userType === 'doctor' ? t('userTypes.doctor') : t('userTypes.receptionist') })}</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber color="#48bb78">{statistics.upcomingAsDoctor || statistics.upcoming}</StatNumber>
          <StatLabel>{t('stats.upcomingAs', { role: userType === 'doctor' ? t('userTypes.doctor') : t('userTypes.receptionist') })}</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber color="#9f7aea">{statistics.totalAsPatient || 0}</StatNumber>
          <StatLabel>{t('stats.totalAs', { role: t('userTypes.patient') })}</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber color="#ed8936">{statistics.upcomingAsPatient || 0}</StatNumber>
          <StatLabel>{t('stats.upcomingAs', { role: t('userTypes.patient') })}</StatLabel>
        </StatCard>
      </StatsContainer>
    );
  }

  return (
    <StatsContainer>
      <StatCard>
        <StatNumber color="#667eea">{statistics.totalAsPatient || statistics.total}</StatNumber>
        <StatLabel>{t('stats.totalAppointments')}</StatLabel>
      </StatCard>
      <StatCard>
        <StatNumber color="#48bb78">{statistics.upcomingAsPatient || statistics.upcoming}</StatNumber>
        <StatLabel>{t('stats.upcoming')}</StatLabel>
      </StatCard>
      <StatCard>
        <StatNumber color="#ed8936">{statistics.completedAsPatient || statistics.completed}</StatNumber>
        <StatLabel>{t('stats.completed')}</StatLabel>
      </StatCard>
      <StatCard>
        <StatNumber color="#f56565">{statistics.canceledAsPatient || statistics.canceled}</StatNumber>
        <StatLabel>{t('stats.canceled')}</StatLabel>
      </StatCard>
    </StatsContainer>
  );
};

export default AppointmentStats;

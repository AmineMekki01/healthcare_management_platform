import React, { useState, useEffect, useContext } from 'react';
import axios from './../components/axiosConfig';
import { 
  Title, Container, Flex, FilterContainer, FilterInput, SectionTitle, 
  StatsContainer, StatCard, StatNumber, StatLabel, EmptyState,
  TabContainer, Tab, RoleSelector, RoleButton, ContentContainer,
  QuickActionContainer, QuickActionButton, AppointmentCounter
} from './styles/AppointmentDashboard.styles';
import AppointmentCard from '../components/Appointments/AppointmentCard';
import { AuthContext } from './../components/Auth/AuthContext';


export default function Dashboard() {
  const [doctorReservations, setDoctorReservations] = useState([]);
  const [patientReservations, setPatientReservations] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedRole, setSelectedRole] = useState('doctor'); // For doctors who can see both roles
  const { userType, userId } = useContext(AuthContext);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        if (!userId) {
          return;
        }
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const params = {
          timezone,
          user_id: userId,
          user_type: userType,
        };

        const response = await axios.get('/api/v1/reservations', { params });
        const now = new Date();
        if (userType === 'doctor') {
          const activeDoctorAppts = response.data.filter(r => !r.is_doctor_patient && !r.Canceled && new Date(r.reservation_end) > now);
          const passedDoctorAppts = response.data.filter(r => !r.is_doctor_patient && !r.Canceled && new Date(r.reservation_end) <= now);
          const canceledDoctorAppts = response.data.filter(r => !r.is_doctor_patient && r.Canceled);

          const activePatientAppts = response.data.filter(r => r.is_doctor_patient && !r.Canceled && new Date(r.reservation_end) > now);
          const passedPatientAppts = response.data.filter(r => r.is_doctor_patient && !r.Canceled && new Date(r.reservation_end) <= now);
          const canceledPatientAppts = response.data.filter(r => r.is_doctor_patient && r.Canceled);

          setDoctorReservations({ active: activeDoctorAppts, passed: passedDoctorAppts, canceled: canceledDoctorAppts });
          setPatientReservations({ active: activePatientAppts, passed: passedPatientAppts, canceled: canceledPatientAppts });
        } else {
          const activePatientAppts = response.data.filter(r => !r.Canceled && new Date(r.reservation_end) > now);
          const passedPatientAppts = response.data.filter(r => !r.Canceled && new Date(r.reservation_end) <= now);
          const canceledPatientAppts = response.data.filter(r => r.Canceled);

          setPatientReservations({ active: activePatientAppts, passed: passedPatientAppts, canceled: canceledPatientAppts });
        }
      } catch (error) {
        console.error('Error fetching reservations:', error);
      }
    };

    fetchReservations();
  }, [userId, userType]);

  const filterReservations = (reservations) => {
    return reservations.filter(reservation =>
      reservation.doctor_first_name.toLowerCase().includes(filterText.toLowerCase()) ||
      reservation.doctor_last_name.toLowerCase().includes(filterText.toLowerCase()) ||
      reservation.patient_first_name.toLowerCase().includes(filterText.toLowerCase()) ||
      reservation.patient_last_name.toLowerCase().includes(filterText.toLowerCase())
    );
  };

  const getTabAppointments = () => {
    if (userType === 'patient') {
      switch (activeTab) {
        case 'upcoming':
          return patientReservations.active || [];
        case 'completed':
          return patientReservations.passed || [];
        case 'canceled':
          return patientReservations.canceled || [];
        case 'all':
          return [
            ...(patientReservations.active || []),
            ...(patientReservations.passed || []),
            ...(patientReservations.canceled || [])
          ];
        default:
          return [];
      }
    } else {
      // Doctor view with role selection
      const reservations = selectedRole === 'doctor' ? doctorReservations : patientReservations;
      switch (activeTab) {
        case 'upcoming':
          return reservations.active || [];
        case 'completed':
          return reservations.passed || [];
        case 'canceled':
          return reservations.canceled || [];
        case 'all':
          return [
            ...(reservations.active || []),
            ...(reservations.passed || []),
            ...(reservations.canceled || [])
          ];
        default:
          return [];
      }
    }
  };

  const getCurrentStats = () => {
    if (userType === 'patient') {
      return {
        upcoming: patientReservations.active?.length || 0,
        completed: patientReservations.passed?.length || 0,
        canceled: patientReservations.canceled?.length || 0,
        total: (patientReservations.active?.length || 0) + 
               (patientReservations.passed?.length || 0) + 
               (patientReservations.canceled?.length || 0)
      };
    } else {
      const reservations = selectedRole === 'doctor' ? doctorReservations : patientReservations;
      return {
        upcoming: reservations.active?.length || 0,
        completed: reservations.passed?.length || 0,
        canceled: reservations.canceled?.length || 0,
        total: (reservations.active?.length || 0) + 
               (reservations.passed?.length || 0) + 
               (reservations.canceled?.length || 0)
      };
    }
  };

  const getTabTitle = () => {
    const roleText = userType === 'doctor' ? ` as ${selectedRole === 'doctor' ? 'Doctor' : 'Patient'}` : '';
    switch (activeTab) {
      case 'upcoming':
        return `Upcoming Appointments${roleText}`;
      case 'completed':
        return `Completed Appointments${roleText}`;
      case 'canceled':
        return `Canceled Appointments${roleText}`;
      case 'all':
        return `All Appointments${roleText}`;
      default:
        return `Appointments${roleText}`;
    }
  };

  const currentAppointments = getTabAppointments();
  const filteredAppointments = filterReservations(currentAppointments);
  const stats = getCurrentStats();

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: stats.upcoming },
    { id: 'completed', label: 'Completed', count: stats.completed },
    { id: 'canceled', label: 'Canceled', count: stats.canceled },
    { id: 'all', label: 'All', count: stats.total }
  ];

  const getStatistics = () => {
    if (userType === 'doctor') {
      const totalDoctorAppts = (doctorReservations.active?.length || 0) + (doctorReservations.passed?.length || 0) + (doctorReservations.canceled?.length || 0);
      const totalPatientAppts = (patientReservations.active?.length || 0) + (patientReservations.passed?.length || 0) + (patientReservations.canceled?.length || 0);
      
      return {
        totalAsDoctor: totalDoctorAppts,
        totalAsPatient: totalPatientAppts,
        upcomingAsDoctor: doctorReservations.active?.length || 0,
        upcomingAsPatient: patientReservations.active?.length || 0,
        completedAsDoctor: doctorReservations.passed?.length || 0,
        completedAsPatient: patientReservations.passed?.length || 0,
      };
    } else {
      const total = (patientReservations.active?.length || 0) + (patientReservations.passed?.length || 0) + (patientReservations.canceled?.length || 0);
      return {
        total: total,
        upcoming: patientReservations.active?.length || 0,
        completed: patientReservations.passed?.length || 0,
        canceled: patientReservations.canceled?.length || 0,
      };
    }
  };

  const overallStats = getStatistics();

  const renderAppointmentSection = (appointments, title, emptyMessage) => (
    <>
      <SectionTitle>{title}</SectionTitle>
      {appointments && appointments.length > 0 ? (
        <Flex>
          {filterReservations(appointments).map(reservation => (
            <AppointmentCard
              key={reservation.reservation_id}
              reservation={reservation}
              userType={userType === 'doctor' && title.includes('Patient') ? 'patient' : userType}
            />
          ))}
        </Flex>
      ) : (
        <EmptyState>{emptyMessage}</EmptyState>
      )}
    </>
  );

  return (
    <Container>
      <Title>My Appointments Dashboard</Title>
      
      {/* Overall Statistics */}
      <StatsContainer>
        {userType === 'doctor' ? (
          <>
            <StatCard>
              <StatNumber color="#667eea">{overallStats.totalAsDoctor}</StatNumber>
              <StatLabel>Total as Doctor</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber color="#48bb78">{overallStats.upcomingAsDoctor}</StatNumber>
              <StatLabel>Upcoming as Doctor</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber color="#9f7aea">{overallStats.totalAsPatient}</StatNumber>
              <StatLabel>Total as Patient</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber color="#ed8936">{overallStats.upcomingAsPatient}</StatNumber>
              <StatLabel>Upcoming as Patient</StatLabel>
            </StatCard>
          </>
        ) : (
          <>
            <StatCard>
              <StatNumber color="#667eea">{overallStats.total}</StatNumber>
              <StatLabel>Total Appointments</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber color="#48bb78">{overallStats.upcoming}</StatNumber>
              <StatLabel>Upcoming</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber color="#ed8936">{overallStats.completed}</StatNumber>
              <StatLabel>Completed</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber color="#f56565">{overallStats.canceled}</StatNumber>
              <StatLabel>Canceled</StatLabel>
            </StatCard>
          </>
        )}
      </StatsContainer>

      {/* Role Selector for Doctors */}
      {userType === 'doctor' && (
        <RoleSelector>
          <RoleButton 
            active={selectedRole === 'doctor'}
            onClick={() => setSelectedRole('doctor')}
          >
            👨‍⚕️ My Appointments as Doctor
          </RoleButton>
          <RoleButton 
            active={selectedRole === 'patient'}
            onClick={() => setSelectedRole('patient')}
          >
            🏥 My Appointments as Patient
          </RoleButton>
        </RoleSelector>
      )}

      {/* Search Filter */}
      <FilterContainer>
        <FilterInput
          type="text"
          placeholder="🔍 Search by doctor or patient name..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </FilterContainer>

      {/* Tab Navigation */}
      <TabContainer>
        {tabs.map(tab => (
          <Tab
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </Tab>
        ))}
      </TabContainer>

      {/* Content Area */}
      <ContentContainer>
        <AppointmentCounter>
          Showing {filteredAppointments.length} of {currentAppointments.length} appointments
          <span>{getTabTitle()}</span>
        </AppointmentCounter>

        {filteredAppointments.length > 0 ? (
          <Flex>
            {filteredAppointments.map(reservation => (
              <AppointmentCard
                key={reservation.reservation_id}
                reservation={reservation}
                userType={userType === 'doctor' && selectedRole === 'patient' ? 'patient' : userType}
              />
            ))}
          </Flex>
        ) : (
          <EmptyState>
            {currentAppointments.length === 0 
              ? `No ${activeTab} appointments found` 
              : 'No appointments match your search criteria'
            }
          </EmptyState>
        )}
      </ContentContainer>
    </Container>
  );
}
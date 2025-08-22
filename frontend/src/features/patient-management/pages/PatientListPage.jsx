import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PatientList, PatientSearch, PatientDetails } from '../components';
import { usePatientManagement } from '../hooks/usePatientManagement';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 24px;
`;

const PageHeader = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #1a202c;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const PageSubtitle = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 16px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  }
  
  &.secondary {
    background: white;
    color: #667eea;
    border: 2px solid #667eea;
    
    &:hover {
      background: #667eea;
      color: white;
    }
  }
`;

const HeaderStats = styled.div`
  display: flex;
  gap: 24px;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #1a202c;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: ${props => {
    if (props.$view === 'details') return '1fr 400px';
    if (props.$view === 'search') return '400px 1fr';
    return '1fr';
  }};
  gap: 24px;
  align-items: start;
`;

const MainContent = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const SidePanel = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  max-height: calc(100vh - 200px);
  overflow-y: auto;
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 4px;
`;

const ViewButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: ${props => props.$active ? '#667eea' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  color: #64748b;
  font-size: 16px;
`;

const ErrorState = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 24px;
  border-radius: 12px;
  margin: 24px;
  text-align: center;
`;

const PatientListPage = () => {
  const [view, setView] = useState('list');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0
  });

  const { 
    patients, 
    loading, 
    error, 
    fetchPatients, 
    clearError 
  } = usePatientManagement();

  useEffect(() => {
    const loadData = async () => {
      clearError();
      try {
        await fetchPatients();
      } catch (error) {
        console.error('Failed to load patients:', error);
      }
    };

    loadData();
  }, [fetchPatients, clearError]);

  useEffect(() => {
    if (patients.length > 0) {
      const active = patients.filter(p => p.isActive).length;
      const inactive = patients.length - active;
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newThisMonth = patients.filter(p => 
        new Date(p.createdAt) >= thisMonth
      ).length;

      setStats({
        total: patients.length,
        active,
        inactive,
        newThisMonth
      });
    }
  }, [patients]);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setView('details');
  };

  const handlePatientEdit = (patient) => {
    console.log('Edit patient:', patient);
  };

  const handleBookAppointment = (patient) => {
    console.log('Book appointment for:', patient);
  };

  const handleAddPatient = () => {
    console.log('Add new patient');
  };

  const handleExportData = () => {
    console.log('Export patient data');
  };

  const handleViewChange = (newView) => {
    setView(newView);
    if (newView !== 'details') {
      setSelectedPatient(null);
    }
  };

  if (loading && patients.length === 0) {
    return (
      <PageContainer>
        <LoadingState>Loading patients...</LoadingState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <HeaderTop>
          <div>
            <PageTitle>Patient Management</PageTitle>
            <PageSubtitle>
              Manage patient records, appointments, and medical information
            </PageSubtitle>
          </div>
          <HeaderActions>
            <ViewToggle>
              <ViewButton 
                $active={view === 'list'} 
                onClick={() => handleViewChange('list')}
              >
                List View
              </ViewButton>
              <ViewButton 
                $active={view === 'search'} 
                onClick={() => handleViewChange('search')}
              >
                Search View
              </ViewButton>
            </ViewToggle>
            <ActionButton 
              className="secondary" 
              onClick={handleExportData}
            >
              Export Data
            </ActionButton>
            <ActionButton 
              className="primary" 
              onClick={handleAddPatient}
            >
              Add Patient
            </ActionButton>
          </HeaderActions>
        </HeaderTop>

        <HeaderStats>
          <StatItem>
            <StatNumber>{stats.total}</StatNumber>
            <StatLabel>Total Patients</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{stats.active}</StatNumber>
            <StatLabel>Active</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{stats.inactive}</StatNumber>
            <StatLabel>Inactive</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{stats.newThisMonth}</StatNumber>
            <StatLabel>New This Month</StatLabel>
          </StatItem>
        </HeaderStats>
      </PageHeader>

      {error && (
        <ErrorState>
          Error loading patients: {error}
        </ErrorState>
      )}

      <ContentGrid $view={view}>
        {view === 'search' && (
          <SidePanel>
            <PatientSearch 
              onPatientSelect={handlePatientSelect}
              showFilters={true}
            />
          </SidePanel>
        )}

        <MainContent>
          {view === 'list' && (
            <PatientList
              patients={patients}
              loading={loading}
              onPatientSelect={handlePatientSelect}
              onPatientEdit={handlePatientEdit}
              onBookAppointment={handleBookAppointment}
            />
          )}

          {view === 'search' && (
            <PatientList
              patients={patients}
              loading={loading}
              onPatientSelect={handlePatientSelect}
              onPatientEdit={handlePatientEdit}
              onBookAppointment={handleBookAppointment}
              showSearch={false}
            />
          )}

          {view === 'details' && selectedPatient && (
            <PatientDetails
              patient={selectedPatient}
              onEdit={handlePatientEdit}
              onBookAppointment={handleBookAppointment}
            />
          )}
        </MainContent>

        {view === 'details' && selectedPatient && (
          <SidePanel>
            <PatientList
              patients={patients}
              loading={loading}
              onPatientSelect={handlePatientSelect}
              compact={true}
              showSearch={false}
              selectedPatientId={selectedPatient.id}
            />
          </SidePanel>
        )}
      </ContentGrid>
    </PageContainer>
  );
};

export default PatientListPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { PatientDetails, PatientList } from '../components';
import { usePatientManagement } from '../hooks/usePatientManagement';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 24px;
`;

const PageHeader = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e2e8f0;
    color: #475569;
  }
`;

const BreadcrumbSeparator = styled.span`
  color: #cbd5e1;
  font-size: 18px;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1a202c;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled.button`
  padding: 10px 20px;
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
  
  &.danger {
    background: white;
    color: #dc2626;
    border: 2px solid #dc2626;
    
    &:hover {
      background: #dc2626;
      color: white;
    }
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
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
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const SidePanelSection = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const SectionHeader = styled.div`
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
`;

const SectionContent = styled.div`
  padding: 20px;
`;

const QuickActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const QuickActionButton = styled.button`
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #1a202c;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  
  &:hover {
    border-color: #667eea;
    background: #f8fafc;
  }
`;

const ActionIcon = styled.span`
  font-size: 16px;
`;

const RelatedPatients = styled.div`
  max-height: 400px;
  overflow-y: auto;
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
  text-align: center;
`;

const NotFoundState = styled.div`
  text-align: center;
  padding: 80px 20px;
  color: #64748b;
`;

const NotFoundIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const NotFoundTitle = styled.h2`
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #1a202c;
`;

const NotFoundDescription = styled.p`
  margin: 0 0 24px 0;
  font-size: 16px;
`;

const PatientDetailsPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [relatedPatients, setRelatedPatients] = useState([]);

  const { 
    patient, 
    patients,
    loading, 
    error, 
    fetchPatient,
    fetchPatients,
    deletePatient,
    clearError 
  } = usePatientManagement();

  useEffect(() => {
    const loadData = async () => {
      clearError();
      try {
        if (patientId) {
          await fetchPatient(patientId);
        }
        
        await fetchPatients();
      } catch (error) {
        console.error('Failed to load patient data:', error);
      }
    };

    loadData();
  }, [patientId, fetchPatient, fetchPatients, clearError]);

  useEffect(() => {
    if (patient && patients.length > 0) {
      const related = patients
        .filter(p => p.id !== patient.id)
        .slice(0, 5);
      setRelatedPatients(related);
    }
  }, [patient, patients]);

  const handleBack = () => {
    navigate('/patients');
  };

  const handleEdit = (selectedPatient) => {
    console.log('Edit patient:', selectedPatient);
    navigate(`/patients/${selectedPatient.id}/edit`);
  };

  const handleBookAppointment = (selectedPatient) => {
    console.log('Book appointment for:', selectedPatient);
    navigate(`/appointments/new?patientId=${selectedPatient.id}`);
  };

  const handlePatientSelect = (selectedPatient) => {
    navigate(`/patients/${selectedPatient.id}`);
  };

  const handleDelete = async () => {
    if (!patient) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete patient "${patient.name}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        await deletePatient(patient.id);
        navigate('/patients');
      } catch (error) {
        console.error('Failed to delete patient:', error);
      }
    }
  };

  const handlePrintProfile = () => {
    window.print();
  };

  const handleExportData = () => {
    console.log('Export patient data');
  };

  const handleSendMessage = () => {
    console.log('Send message to patient');
  };

  const handleViewMedicalHistory = () => {
    console.log('View medical history');
  };

  const handleViewAppointments = () => {
    console.log('View appointments');
  };

  const handleViewDocuments = () => {
    console.log('View documents');
  };

  if (loading && !patient) {
    return (
      <PageContainer>
        <LoadingState>Loading patient details...</LoadingState>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState>Error: {error}</ErrorState>
      </PageContainer>
    );
  }

  if (!patient && !loading) {
    return (
      <PageContainer>
        <NotFoundState>
          <NotFoundIcon>👤</NotFoundIcon>
          <NotFoundTitle>Patient Not Found</NotFoundTitle>
          <NotFoundDescription>
            The patient with ID "{patientId}" could not be found.
          </NotFoundDescription>
          <ActionButton className="primary" onClick={handleBack}>
            Back to Patient List
          </ActionButton>
        </NotFoundState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <HeaderLeft>
          <BackButton onClick={handleBack}>
            ← Back
          </BackButton>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <PageTitle>{patient?.name || 'Patient Details'}</PageTitle>
        </HeaderLeft>
        
        <HeaderActions>
          <ActionButton 
            className="secondary" 
            onClick={handlePrintProfile}
          >
            Print Profile
          </ActionButton>
          <ActionButton 
            className="secondary" 
            onClick={handleExportData}
          >
            Export Data
          </ActionButton>
          <ActionButton 
            className="primary" 
            onClick={() => handleEdit(patient)}
          >
            Edit Patient
          </ActionButton>
          <ActionButton 
            className="danger" 
            onClick={handleDelete}
          >
            Delete
          </ActionButton>
        </HeaderActions>
      </PageHeader>

      <ContentGrid>
        <MainContent>
          <PatientDetails
            patient={patient}
            onEdit={handleEdit}
            onBookAppointment={handleBookAppointment}
          />
        </MainContent>

        <SidePanel>
          <SidePanelSection>
            <SectionHeader>Quick Actions</SectionHeader>
            <SectionContent>
              <QuickActions>
                <QuickActionButton onClick={() => handleBookAppointment(patient)}>
                  <ActionIcon>📅</ActionIcon>
                  Book Appointment
                </QuickActionButton>
                <QuickActionButton onClick={handleSendMessage}>
                  <ActionIcon>💬</ActionIcon>
                  Send Message
                </QuickActionButton>
                <QuickActionButton onClick={handleViewMedicalHistory}>
                  <ActionIcon>🏥</ActionIcon>
                  View Medical History
                </QuickActionButton>
                <QuickActionButton onClick={handleViewAppointments}>
                  <ActionIcon>📊</ActionIcon>
                  View Appointments
                </QuickActionButton>
                <QuickActionButton onClick={handleViewDocuments}>
                  <ActionIcon>📎</ActionIcon>
                  View Documents
                </QuickActionButton>
              </QuickActions>
            </SectionContent>
          </SidePanelSection>

          <SidePanelSection>
            <SectionHeader>Related Patients</SectionHeader>
            <SectionContent>
              <RelatedPatients>
                <PatientList
                  patients={relatedPatients}
                  loading={false}
                  onPatientSelect={handlePatientSelect}
                  compact={true}
                  showSearch={false}
                  showActions={false}
                />
              </RelatedPatients>
            </SectionContent>
          </SidePanelSection>
        </SidePanel>
      </ContentGrid>
    </PageContainer>
  );
};

export default PatientDetailsPage;

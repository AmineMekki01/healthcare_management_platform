import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { UserProfile, UserAvatar } from '../../user-management';
import { usePatientManagement } from '../hooks/usePatientManagement';

const DetailsContainer = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const DetailsHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
`;

const PatientBasic = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
`;

const PatientInfo = styled.div`
  flex: 1;
`;

const PatientName = styled.h1`
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
`;

const PatientId = styled.p`
  margin: 0 0 4px 0;
  font-size: 14px;
  opacity: 0.8;
`;

const PatientStatus = styled.span`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => props.$active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  color: ${props => props.$active ? '#16a34a' : '#dc2626'};
  border: 1px solid ${props => props.$active ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
`;

const PatientActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled.button`
  padding: 10px 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  &.primary {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
  }
`;

const TabsContainer = styled.div`
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const Tabs = styled.div`
  display: flex;
  gap: 0;
`;

const Tab = styled.button`
  padding: 12px 24px;
  background: none;
  border: none;
  color: ${props => props.$active ? 'white' : 'rgba(255, 255, 255, 0.7)'};
  font-weight: ${props => props.$active ? '600' : '400'};
  cursor: pointer;
  border-bottom: 2px solid ${props => props.$active ? 'white' : 'transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    color: white;
  }
`;

const DetailsBody = styled.div`
  padding: 24px;
`;

const TabContent = styled.div`
  display: ${props => props.$active ? 'block' : 'none'};
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
`;

const Section = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
`;

const SectionTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionIcon = styled.span`
  font-size: 18px;
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-weight: 500;
  color: #64748b;
  font-size: 14px;
`;

const InfoValue = styled.span`
  color: #1a202c;
  font-size: 14px;
  text-align: right;
`;

const TimelineContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const TimelineItem = styled.div`
  display: flex;
  gap: 16px;
  padding: 16px;
  border-left: 3px solid #e2e8f0;
  margin-left: 12px;
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    left: -8px;
    top: 20px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #667eea;
    border: 3px solid white;
    box-shadow: 0 0 0 1px #e2e8f0;
  }
  
  &:not(:last-child) {
    border-left-color: #cbd5e1;
  }
`;

const TimelineContent = styled.div`
  flex: 1;
`;

const TimelineDate = styled.div`
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
`;

const TimelineTitle = styled.div`
  font-weight: 500;
  color: #1a202c;
  margin-bottom: 4px;
`;

const TimelineDescription = styled.div`
  font-size: 14px;
  color: #64748b;
`;

const DocumentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const DocumentCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #667eea;
    background: #f1f5f9;
  }
`;

const DocumentIcon = styled.div`
  font-size: 32px;
  margin-bottom: 8px;
`;

const DocumentName = styled.div`
  font-weight: 500;
  color: #1a202c;
  margin-bottom: 4px;
  font-size: 14px;
`;

const DocumentDate = styled.div`
  font-size: 12px;
  color: #64748b;
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: #64748b;
`;

const ErrorState = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
`;


const PatientDetails = ({ 
  patientId, 
  patient: initialPatient,
  onEdit,
  onBookAppointment,
  className 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { 
    patient, 
    medicalHistory, 
    appointments, 
    documents, 
    loading, 
    error, 
    fetchPatient,
    fetchPatientMedicalHistory,
    fetchPatientAppointments,
    fetchPatientDocuments,
    clearError 
  } = usePatientManagement();

  useEffect(() => {
    const loadPatientData = async () => {
      if (patientId && !initialPatient) {
        clearError();
        try {
          await fetchPatient(patientId);
        } catch (error) {
          console.error('Failed to load patient:', error);
        }
      }
    };

    loadPatientData();
  }, [patientId, initialPatient, fetchPatient, clearError]);

  useEffect(() => {
    const currentPatient = initialPatient || patient;
    if (currentPatient?.id) {
      if (activeTab === 'medical-history') {
        fetchPatientMedicalHistory(currentPatient.id);
      } else if (activeTab === 'appointments') {
        fetchPatientAppointments(currentPatient.id);
      } else if (activeTab === 'documents') {
        fetchPatientDocuments(currentPatient.id);
      }
    }
  }, [activeTab, initialPatient, patient, fetchPatientMedicalHistory, fetchPatientAppointments, fetchPatientDocuments]);

  const currentPatient = initialPatient || patient;

  const handleEdit = () => {
    if (onEdit && currentPatient) {
      onEdit(currentPatient);
    }
  };

  const handleBookAppointment = () => {
    if (onBookAppointment && currentPatient) {
      onBookAppointment(currentPatient);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getDocumentIcon = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      case 'doc':
      case 'docx': return '📝';
      default: return '📎';
    }
  };

  if (loading && !currentPatient) {
    return (
      <DetailsContainer className={className}>
        <LoadingState>Loading patient details...</LoadingState>
      </DetailsContainer>
    );
  }

  if (error) {
    return (
      <DetailsContainer className={className}>
        <ErrorState>Error: {error}</ErrorState>
      </DetailsContainer>
    );
  }

  if (!currentPatient) {
    return (
      <DetailsContainer className={className}>
        <ErrorState>Patient not found</ErrorState>
      </DetailsContainer>
    );
  }

  return (
    <DetailsContainer className={className}>
      <DetailsHeader>
        <PatientBasic>
          <UserAvatar 
            user={currentPatient} 
            size="large"
            showStatus
          />
          <PatientInfo>
            <PatientName>{currentPatient.name}</PatientName>
            <PatientId>Patient ID: {currentPatient.id}</PatientId>
            <PatientStatus $active={currentPatient.isActive}>
              {currentPatient.isActive ? 'Active' : 'Inactive'}
            </PatientStatus>
          </PatientInfo>
          <PatientActions>
            <ActionButton onClick={handleEdit}>
              Edit Profile
            </ActionButton>
            <ActionButton className="primary" onClick={handleBookAppointment}>
              Book Appointment
            </ActionButton>
          </PatientActions>
        </PatientBasic>

        <TabsContainer>
          <Tabs>
            <Tab 
              $active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </Tab>
            <Tab 
              $active={activeTab === 'medical-history'} 
              onClick={() => setActiveTab('medical-history')}
            >
              Medical History
            </Tab>
            <Tab 
              $active={activeTab === 'appointments'} 
              onClick={() => setActiveTab('appointments')}
            >
              Appointments
            </Tab>
            <Tab 
              $active={activeTab === 'documents'} 
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </Tab>
          </Tabs>
        </TabsContainer>
      </DetailsHeader>

      <DetailsBody>
        <TabContent $active={activeTab === 'overview'}>
          <SectionGrid>
            <Section>
              <SectionTitle>
                <SectionIcon>👤</SectionIcon>
                Personal Information
              </SectionTitle>
              <InfoList>
                <InfoItem>
                  <InfoLabel>Full Name</InfoLabel>
                  <InfoValue>{currentPatient.name}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Email</InfoLabel>
                  <InfoValue>{currentPatient.email}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Phone</InfoLabel>
                  <InfoValue>{currentPatient.phone}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Date of Birth</InfoLabel>
                  <InfoValue>{formatDate(currentPatient.dateOfBirth)}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Age</InfoLabel>
                  <InfoValue>{currentPatient.age || 'N/A'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Gender</InfoLabel>
                  <InfoValue>{currentPatient.gender || 'N/A'}</InfoValue>
                </InfoItem>
              </InfoList>
            </Section>

            <Section>
              <SectionTitle>
                <SectionIcon>🏠</SectionIcon>
                Address & Contact
              </SectionTitle>
              <InfoList>
                <InfoItem>
                  <InfoLabel>Address</InfoLabel>
                  <InfoValue>{currentPatient.address || 'N/A'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>City</InfoLabel>
                  <InfoValue>{currentPatient.city || 'N/A'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>State</InfoLabel>
                  <InfoValue>{currentPatient.state || 'N/A'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>ZIP Code</InfoLabel>
                  <InfoValue>{currentPatient.zipCode || 'N/A'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Emergency Contact</InfoLabel>
                  <InfoValue>{currentPatient.emergencyContact || 'N/A'}</InfoValue>
                </InfoItem>
              </InfoList>
            </Section>

            <Section>
              <SectionTitle>
                <SectionIcon>🏥</SectionIcon>
                Medical Information
              </SectionTitle>
              <InfoList>
                <InfoItem>
                  <InfoLabel>Blood Type</InfoLabel>
                  <InfoValue>{currentPatient.bloodType || 'N/A'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Allergies</InfoLabel>
                  <InfoValue>{currentPatient.allergies || 'None known'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Insurance Provider</InfoLabel>
                  <InfoValue>{currentPatient.insuranceProvider || 'N/A'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Insurance Number</InfoLabel>
                  <InfoValue>{currentPatient.insuranceNumber || 'N/A'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Primary Doctor</InfoLabel>
                  <InfoValue>{currentPatient.primaryDoctor || 'Unassigned'}</InfoValue>
                </InfoItem>
              </InfoList>
            </Section>

            <Section>
              <SectionTitle>
                <SectionIcon>📊</SectionIcon>
                Account Status
              </SectionTitle>
              <InfoList>
                <InfoItem>
                  <InfoLabel>Registration Date</InfoLabel>
                  <InfoValue>{formatDate(currentPatient.createdAt)}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Last Visit</InfoLabel>
                  <InfoValue>{formatDate(currentPatient.lastVisit)}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Total Visits</InfoLabel>
                  <InfoValue>{currentPatient.totalVisits || 0}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Account Status</InfoLabel>
                  <InfoValue>
                    <PatientStatus $active={currentPatient.isActive}>
                      {currentPatient.isActive ? 'Active' : 'Inactive'}
                    </PatientStatus>
                  </InfoValue>
                </InfoItem>
              </InfoList>
            </Section>
          </SectionGrid>
        </TabContent>

        <TabContent $active={activeTab === 'medical-history'}>
          {loading ? (
            <LoadingState>Loading medical history...</LoadingState>
          ) : (
            <TimelineContainer>
              {medicalHistory.map((record, index) => (
                <TimelineItem key={index}>
                  <TimelineContent>
                    <TimelineDate>{formatDate(record.date)}</TimelineDate>
                    <TimelineTitle>{record.diagnosis || 'Medical Record'}</TimelineTitle>
                    <TimelineDescription>
                      {record.description || record.notes || 'No details available'}
                    </TimelineDescription>
                  </TimelineContent>
                </TimelineItem>
              ))}
              {medicalHistory.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No medical history found
                </div>
              )}
            </TimelineContainer>
          )}
        </TabContent>

        <TabContent $active={activeTab === 'appointments'}>
          {loading ? (
            <LoadingState>Loading appointments...</LoadingState>
          ) : (
            <TimelineContainer>
              {appointments.map((appointment, index) => (
                <TimelineItem key={index}>
                  <TimelineContent>
                    <TimelineDate>
                      {formatDate(appointment.date)} at {appointment.time}
                    </TimelineDate>
                    <TimelineTitle>
                      {appointment.type || 'General Consultation'}
                    </TimelineTitle>
                    <TimelineDescription>
                      Doctor: {appointment.doctorName || 'TBD'} | 
                      Status: {appointment.status || 'Scheduled'}
                    </TimelineDescription>
                  </TimelineContent>
                </TimelineItem>
              ))}
              {appointments.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No appointments found
                </div>
              )}
            </TimelineContainer>
          )}
        </TabContent>

        <TabContent $active={activeTab === 'documents'}>
          {loading ? (
            <LoadingState>Loading documents...</LoadingState>
          ) : (
            <DocumentGrid>
              {documents.map((document, index) => (
                <DocumentCard key={index}>
                  <DocumentIcon>{getDocumentIcon(document.name)}</DocumentIcon>
                  <DocumentName>{document.name}</DocumentName>
                  <DocumentDate>{formatDate(document.uploadDate)}</DocumentDate>
                </DocumentCard>
              ))}
              {documents.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No documents found
                </div>
              )}
            </DocumentGrid>
          )}
        </TabContent>
      </DetailsBody>
    </DetailsContainer>
  );
};

export default PatientDetails;

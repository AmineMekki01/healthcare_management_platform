import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import UserProfile from '../components/UserProfile';
import { useUserManagement } from '../hooks/useUserManagement';

const ReceptionistProfileContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 16px;
  }
`;

const MainProfile = styled.div`
  grid-column: 1;
`;

const Sidebar = styled.div`
  grid-column: 2;
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-column: 1;
    grid-row: 1;
  }
`;

const StatsCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, #805ad5 0%, #6b46c1 100%);
  border-radius: 12px;
  color: white;
`;

const StatNumber = styled.div`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const WorkInfoCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const ExperienceCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
`;

const ExperienceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ExperienceItem = styled.div`
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
`;

const ExperienceTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
`;

const ExperienceTitle = styled.div`
  font-weight: 700;
  color: #1a202c;
`;

const ExperienceDates = styled.div`
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
`;

const ExperienceSubtitle = styled.div`
  margin-top: 4px;
  font-size: 13px;
  color: #4b5563;
  font-weight: 600;
`;

const ExperienceMeta = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
`;

const ExperienceDescription = styled.div`
  margin-top: 8px;
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
`;

const EmptyExperience = styled.div`
  padding: 14px 16px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #64748b;
  font-size: 13px;
`;

const WorkInfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const WorkInfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #805ad515 0%, #6b46c115 100%);
  border: 1px solid #805ad530;
  border-radius: 12px;
  font-size: 14px;
`;

const InfoLabel = styled.span`
  font-weight: 500;
  color: #2d3748;
`;

const InfoValue = styled.span`
  color: #805ad5;
  font-weight: 600;
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  
  ${props => props.$active ? `
    background: #c6f6d5;
    color: #22543d;
  ` : `
    background: #fed7d7;
    color: #c53030;
  `}
`;


const SectionTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: #64748b;
  font-size: 16px;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 16px;
  border-radius: 8px;
  margin: 24px;
`;

const ReceptionistProfilePage = () => {
  const { receptionistId } = useParams();
  const { user: receptionist, loading, error, fetchUser } = useUserManagement();
  const [receptionistStats, setReceptionistStats] = useState({
    appointmentsHandled: 0,
    patientsManaged: 0,
    tasksCompleted: 0,
    workDays: 0
  });
  const [workSchedule, setWorkSchedule] = useState([]);
  const [permissions, setPermissions] = useState([]);

  const receptionistFields = [
    { key: 'firstName', label: 'First Name', type: 'text' },
    { key: 'lastName', label: 'Last Name', type: 'text' },
    { key: 'username', label: 'Username', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phoneNumber', label: 'Phone', type: 'tel' },
    { key: 'birthDate', label: 'Date of Birth', type: 'date' },
    { key: 'sex', label: 'Gender', type: 'text' },
    { key: 'bio', label: 'Bio', type: 'textarea' },
    { key: 'streetAddress', label: 'Street Address', type: 'text' },
    { key: 'cityName', label: 'City', type: 'text' },
    { key: 'stateName', label: 'State', type: 'text' },
    { key: 'zipCode', label: 'Zip Code', type: 'text' },
    { key: 'countryName', label: 'Country', type: 'text' },
  ];

  useEffect(() => {
    if (receptionistId) {
      fetchUser(receptionistId, 'receptionist');
    }
  }, [receptionistId, fetchUser]);


  const handleProfileSave = (updatedReceptionist) => {
    console.log('Receptionist profile updated:', updatedReceptionist);
  };

  if (loading.user) {
    return <LoadingMessage>Loading receptionist profile...</LoadingMessage>;
  }

  if (error.user) {
    return <ErrorMessage>Error loading receptionist profile: {error.user}</ErrorMessage>;
  }
  if (!receptionist) {
    return <ErrorMessage>Receptionist not found</ErrorMessage>;
  }

  const experienceYears = typeof receptionist?.experienceYears === 'number'
    ? receptionist.experienceYears
    : (typeof receptionist?.experience === 'number' ? receptionist.experience : 0);

  const experiences = Array.isArray(receptionist?.experiences) ? receptionist.experiences : [];

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString();
  };

  return (
    <ReceptionistProfileContainer>
      <MainProfile>
        <UserProfile
          userId={receptionistId}
          user={receptionist}
          userType="receptionist"
          editable={false}
          customFields={receptionistFields}
          onSave={handleProfileSave}
        />
      </MainProfile>

      <Sidebar>
        {/* Receptionist Statistics */}
        {/* <StatsCard>
          <SectionTitle>Work Statistics</SectionTitle>
          <StatsGrid>
            <StatItem>
              <StatNumber>{receptionistStats.appointmentsHandled || 0}</StatNumber>
              <StatLabel>Appointments</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{receptionistStats.patientsManaged || 0}</StatNumber>
              <StatLabel>Patients</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{receptionistStats.tasksCompleted || 0}</StatNumber>
              <StatLabel>Tasks</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{workSchedule.length || 0}</StatNumber>
              <StatLabel>Work Days</StatLabel>
            </StatItem>
          </StatsGrid>
        </StatsCard> */}

        {/* Work Information */}
        <WorkInfoCard>
          <SectionTitle>Work Information</SectionTitle>
          <WorkInfoList>
            <WorkInfoItem>
              <InfoLabel>Status:</InfoLabel>
              <StatusBadge $active={receptionist?.isActive}>
                {receptionist?.isActive ? 'Active' : 'Inactive'}
              </StatusBadge>
            </WorkInfoItem>
            <WorkInfoItem>
              <InfoLabel>Email Verified:</InfoLabel>
              <StatusBadge $active={receptionist?.emailVerified}>
                {receptionist?.emailVerified ? 'Verified' : 'Pending'}
              </StatusBadge>
            </WorkInfoItem>
            <WorkInfoItem>
              <InfoLabel>Assigned Doctor:</InfoLabel>
              <InfoValue>{receptionist?.assignedDoctorId ? 'Assigned' : 'Unassigned'}</InfoValue>
            </WorkInfoItem>
            <WorkInfoItem>
              <InfoLabel>Join Date:</InfoLabel>
              <InfoValue>
                {receptionist?.createdAt ? new Date(receptionist.createdAt).toLocaleDateString() : 'N/A'}
              </InfoValue>
            </WorkInfoItem>
            <WorkInfoItem>
              <InfoLabel>Experience:</InfoLabel>
              <InfoValue>{experienceYears.toFixed(1)} years</InfoValue>
            </WorkInfoItem>
          </WorkInfoList>
        </WorkInfoCard>

        <ExperienceCard>
          <SectionTitle>Work Experience</SectionTitle>
          <ExperienceList>
            {experiences.length === 0 ? (
              <EmptyExperience>No experience entries yet.</EmptyExperience>
            ) : (
              experiences.map((exp) => {
                const start = formatDate(exp?.startDate);
                const end = exp?.endDate ? formatDate(exp.endDate) : 'Present';
                const location = exp?.location ? String(exp.location) : '';
                return (
                  <ExperienceItem key={exp?.experienceId || `${exp?.organizationName}-${exp?.positionTitle}-${exp?.startDate}`}
                  >
                    <ExperienceTitleRow>
                      <ExperienceTitle>{exp?.organizationName || 'Unknown Organization'}</ExperienceTitle>
                      <ExperienceDates>{start} - {end}</ExperienceDates>
                    </ExperienceTitleRow>
                    <ExperienceSubtitle>{exp?.positionTitle || 'Role'}</ExperienceSubtitle>
                    {location && (
                      <ExperienceMeta>{location}</ExperienceMeta>
                    )}
                    {exp?.description && (
                      <ExperienceDescription>{exp.description}</ExperienceDescription>
                    )}
                  </ExperienceItem>
                );
              })
            )}
          </ExperienceList>
        </ExperienceCard>
      </Sidebar>
    </ReceptionistProfileContainer>
  );
};

export default ReceptionistProfilePage;

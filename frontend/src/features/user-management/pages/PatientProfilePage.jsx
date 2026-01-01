 import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import UserProfile from '../components/UserProfile';
import { useUserManagement } from '../hooks/useUserManagement';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTranslation } from 'react-i18next';

const PatientProfileContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
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
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
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

const HealthInfoCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const HealthInfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HealthInfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #48bb7815 0%, #38a16915 100%);
  border: 1px solid #48bb7830;
  border-radius: 12px;
  font-size: 14px;
`;

const InfoLabel = styled.span`
  font-weight: 500;
  color: #2d3748;
`;

const InfoValue = styled.span`
  color: #48bb78;
  font-weight: 600;
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

const PatientProfilePage = () => {
  const { t, i18n } = useTranslation(['userManagement', 'common']);
  const navigate = useNavigate();
  const { patientId } = useParams();
  const { user: patient, loading, error, fetchUser } = useUserManagement();
  const { currentUser } = useAuth();
  console.log('patient', patient);
  const isArabic = (i18n?.language || '').toLowerCase().startsWith('ar');
  const isFrench = (i18n?.language || '').toLowerCase().startsWith('fr');
  const languageCode = isArabic ? 'ar' : (isFrench ? 'fr' : 'en');

  const [patientStats, setPatientStats] = useState({
    appointments: 0,
    records: 0,
    doctors: 0,
    lastVisit: 'N/A',
    totalVisits: 0
  });

  const canViewMedicalRecords = currentUser && (currentUser.userType === 'doctor' || currentUser.userId === patientId);
  const canScheduleAppointment = currentUser && (currentUser.userType === 'doctor' || currentUser.userType === 'receptionist');

  const patientFields = [
    { key: 'firstName', label: t('userProfile.fields.firstName'), type: 'text' },
    { key: 'lastName', label: t('userProfile.fields.lastName'), type: 'text' },
    { key: 'email', label: t('userProfile.fields.email'), type: 'email' },
    { key: 'phoneNumber', label: t('userProfile.fields.phoneNumber'), type: 'tel' },
    { key: 'birthDate', label: t('userProfile.fields.dateOfBirth'), type: 'date' },
    { key: 'age', label: t('userProfile.fields.age'), type: 'number' },
    { key: 'bio', label: t('userProfile.fields.bio'), type: 'textarea' },
    { key: 'streetAddress', label: t('userProfile.fields.address'), type: 'text' },
    { key: 'cityName', label: t('userProfile.fields.city'), type: 'text' },
    { key: 'stateName', label: t('userProfile.fields.state'), type: 'text' },
    { key: 'zipCode', label: t('userProfile.fields.zipCode'), type: 'text' },
    { key: 'countryName', label: t('userProfile.fields.country'), type: 'text' },
  ];

  useEffect(() => {
    if (patientId) {
      fetchUser(patientId, 'patient');
    }
  }, [patientId, fetchUser]);

  useEffect(() => {
    if (patient) {
      fetchPatientStats();
    }
  }, [patient]);

  const fetchPatientStats = () => {
    try {
      if (patient) {
        setPatientStats({
          appointments: patient?.totalAppointments || 0,
          records: patient?.totalRecords || 0,
          doctors: patient?.doctorsVisited || 0,
          lastVisit: patient?.lastVisit || 'N/A',
          totalVisits: patient?.totalVisits || 0
        });
      }
    } catch (error) {
      console.error('Error fetching patient stats:', error);
      setPatientStats({
        appointments: 0,
        records: 0,
        doctors: 0,
        lastVisit: 'N/A',
        totalVisits: 0
      });
    }
  };

  const handleProfileSave = (updatedPatient) => {
    console.log('Patient profile updated:', updatedPatient);
  };

  if (loading.user) {
    return <LoadingMessage>Loading patient profile...</LoadingMessage>;
  }

  if (error.user) {
    return <ErrorMessage>Error loading patient profile: {error.user}</ErrorMessage>;
  }

  if (!patient) {
    return <ErrorMessage>Patient not found</ErrorMessage>;
  }

  return (
    <PatientProfileContainer>
      <ProfileGrid>
        <MainProfile>
          <UserProfile
            userId={patientId}
            userType="patient"
            user={patient}
            editable={false}
            customFields={patientFields}
            onSave={handleProfileSave}
            headerActions={[
              ...(canScheduleAppointment ? [{
                label: 'Schedule Appointment',
                variant: 'primary',
                onClick: () => navigate('/receptionist/create-appointment', { 
                  state: { 
                    patient: {
                      patient_id: patientId,
                      id: patientId,
                      name: `${patient?.firstName} ${patient?.lastName}`,
                      firstName: patient?.firstName,
                      lastName: patient?.lastName,
                      email: patient?.email,
                      phoneNumber: patient?.phoneNumber
                    }
                  }
                }),
                small: true
              }] : []),
              ...(canViewMedicalRecords ? [{
                label: 'View Medical Records',
                variant: 'secondary',
                onClick: () => navigate(`/records/${patientId}`),
                small: true
              }] : []),
              ...(currentUser && currentUser.userId !== patientId && currentUser.userType === 'doctor' ? [{
                label: 'Send Message',
                variant: 'secondary',
                onClick: () => navigate('/Messages'),
                small: true
              }] : [])
            ]}
          />
        </MainProfile>

        <Sidebar>
          {/* Health Information */}
          <HealthInfoCard>
            <SectionTitle>Health Information</SectionTitle>
            <HealthInfoList>
              <HealthInfoItem>
                <InfoLabel>
                  {t('patientProfile.healthInfo.gender')}
                </InfoLabel>
                <InfoValue>
                  {t(`common:patient.gender.${(patient?.sex || 'unknown').toLowerCase()}`)}
                </InfoValue>
              </HealthInfoItem>
              <HealthInfoItem>
                <InfoLabel>
                  {t('patientProfile.healthInfo.bloodType')}
                </InfoLabel>
                <InfoValue>{patient?.healthProfile.bloodGroup || 'Unknown'}</InfoValue>
              </HealthInfoItem>
            </HealthInfoList>
          </HealthInfoCard>

          {/* Medical History */}
          {patient?.medicalHistory && Array.isArray(patient.medicalHistory) && patient.medicalHistory.length > 0 && (
            <HealthInfoCard>
              <SectionTitle>Medical History</SectionTitle>
              <HealthInfoList>
                {patient.medicalHistory.slice(0, 3).map((condition, index) => (
                  <HealthInfoItem key={index}>
                    <InfoLabel>
                      {typeof condition === 'object' 
                        ? (condition.condition || condition.name || `Condition ${index + 1}`)
                        : condition || `Condition ${index + 1}`}:
                    </InfoLabel>
                    <InfoValue>
                      {typeof condition === 'object' 
                        ? (condition.status || condition.date || 'Active')
                        : 'Active'}
                    </InfoValue>
                  </HealthInfoItem>
                ))}
                {patient.medicalHistory.length > 3 && (
                  <HealthInfoItem>
                    <InfoLabel>More:</InfoLabel>
                    <InfoValue>{patient.medicalHistory.length - 3} more conditions</InfoValue>
                  </HealthInfoItem>
                )}
              </HealthInfoList>
            </HealthInfoCard>
          )}

          {/* Allergies */}
          {patient?.healthProfile.allergies && Array.isArray(patient.healthProfile.allergies) && patient.healthProfile.allergies.length > 0 && (
            <HealthInfoCard>
              <SectionTitle>Allergies</SectionTitle>
              <HealthInfoList>
                {patient.healthProfile.allergies.slice(0, 3).map((allergy, index) => (
                  <HealthInfoItem key={index}>
                    <InfoLabel>
                      {allergy}
                    </InfoLabel>
                  </HealthInfoItem>
                ))}
              </HealthInfoList>
            </HealthInfoCard>
          )}

          {/* Current Medications */}
          {patient?.medications && Array.isArray(patient.medications) && patient.medications.length > 0 && (
            <HealthInfoCard>
              <SectionTitle>Current Medications</SectionTitle>
              <HealthInfoList>
                {patient.medications.slice(0, 3).map((medication, index) => (
                  <HealthInfoItem key={index}>
                    <InfoLabel>
                      {typeof medication === 'object' 
                        ? (medication.name || medication.medication || `Medication ${index + 1}`)
                        : medication || `Medication ${index + 1}`}:
                    </InfoLabel>
                    <InfoValue>
                      {typeof medication === 'object' 
                        ? (medication.dosage || medication.dose || 'Prescribed')
                        : 'Prescribed'}
                    </InfoValue>
                  </HealthInfoItem>
                ))}
                {patient.medications.length > 3 && (
                  <HealthInfoItem>
                    <InfoLabel>More:</InfoLabel>
                    <InfoValue>{patient.medications.length - 3} more medications</InfoValue>
                  </HealthInfoItem>
                )}
              </HealthInfoList>
            </HealthInfoCard>
          )}

        </Sidebar>
      </ProfileGrid>
    </PatientProfileContainer>
  );
};

export default PatientProfilePage;

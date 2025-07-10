import React, { useState, useEffect, useContext } from 'react';
import axios from './../../axiosConfig';
import {
  Header, Section, Title, Subtitle, Statistic, StatBox, Text, List, ListItem, ProfileImage, LeftColumn, RightColumn, MainContainer, BodyContainer, FollowButton, DoctorInfoContainer, DoctorName, DoctorInfo,
  HistoryItem,
  DiagnosisName,
  DiagnosisDate, DiagnosisLink
} from './../Doctor/styles/DoctorProfileStyles';
import { useParams } from 'react-router-dom';
import { AuthContext } from './../../Auth/AuthContext';

import styled from 'styled-components';

export const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #4a90e2;
  font-size: 0.9rem;
  display: flex;
  gap: 0.5rem;

  &:hover {
    text-decoration: underline;
  }
`;

export default function PatientProfile() {
  const { patientId } = useParams();
  const [patientInfo, setPatientInfo] = useState({});
  const [medicalHistoryInfo, setMedicalHistoryInfo] = useState({});
  const [medications, setMedications] = useState({});

  const [userFollowings, setUserFollowings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { userType, userId, userProfilePhotoUrl } = useContext(AuthContext);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  const fetchPatientInfo = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/v1/user/${patientId}`, {
        params: {
          userType: "patient",
        },
      });
      setPatientInfo(response.data);
      console.log("patient_info : ", response.data);
    } catch (error) {
      console.error("Error fetching patient info:", error);
      setError('An error occurred while fetching the patient information.');
    }
  };

  const fetchFollowings = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/v1/patient-followings/${patientId}`);
      setUserFollowings(response.data.following_users);
    } catch (error) {
      console.log("Error while getting users followings:", error);
      setUserFollowings([]);
    }
  };

  const getMedicalHistory = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/v1/patients/medical-history/${patientId}`);
      setMedicalHistoryInfo(response.data);
      console.log("medical history : ", response);
    } catch (error) {
      console.error("Error fetching medical history:", error);
      setMedicalHistoryInfo([]);
    }
  };

  const getMedications = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/v1/patients/medications/${patientId}`);
      setMedications(response.data);
      console.log("medications : ", response.data);
    } catch (error) {
      console.error("Error fetching medications:", error);
      setMedications([]);
      setError('');
    }
  };

  useEffect(() => {
    const loadPatientData = async () => {
      setLoading(true);
      setError('');
      
      try {
        await Promise.all([
          fetchPatientInfo(),
          fetchFollowings(),
          getMedicalHistory(),
          getMedications()
        ]);
      } catch (error) {
        console.error("Error loading patient data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const handleFollowClick = () => {
    setIsProcessingFollow(true);
    axios.post('http://localhost:3001/api/v1/follow-patient', {
        patient_id: patientId,
        follower_id: userId,
        follower_type: userType,
      })
      .then(response => {
        setIsFollowing(true);
      })
      .catch(error => {
        console.error(error);
        alert('An error occurred while trying to follow the patient.');
      })
      .finally(() => {
        setIsProcessingFollow(false);
      });
  };

  if (loading) return (
    <MainContainer>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div>Loading patient information...</div>
      </div>
    </MainContainer>
  );
  
  if (error) return (
    <MainContainer>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', color: 'red' }}>
        <div>{error}</div>
      </div>
    </MainContainer>
  );

  const capitalizeText = (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };
  
  return (
    <MainContainer>
      <Header>
        <ProfileImage src={patientInfo.ProfilePictureUrl || userProfilePhotoUrl} alt="Profile avatar" />
        <DoctorInfoContainer>
          <DoctorName>
            {patientInfo.FirstName ? capitalizeText(patientInfo.FirstName) : ''} {patientInfo.LastName ? patientInfo.LastName.toUpperCase() : ''}
          </DoctorName>
          <DoctorInfo>
            Age: {patientInfo.Age ? patientInfo.Age : 'N/A'}
          </DoctorInfo>
          <DoctorInfo>
            {patientInfo.CityName ? capitalizeText(patientInfo.CityName) : 'Unknown City'}, {patientInfo.CountryName ? capitalizeText(patientInfo.CountryName) : 'Unknown Country'}
          </DoctorInfo>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {userId && userId !== patientId && (
              <FollowButton onClick={handleFollowClick} disabled={isProcessingFollow || isFollowing}>
                {isProcessingFollow ? 'Processing...' : (isFollowing ? 'Following' : 'Follow')}
              </FollowButton>
            )}
          </div>
        </DoctorInfoContainer>
          
        
      </Header>

      <BodyContainer>
        <LeftColumn>
          <Section>
            <Title>Medical History</Title>
            {medicalHistoryInfo && medicalHistoryInfo.length > 0 ? (
              medicalHistoryInfo.map((medical_history, index) => {
                const formattedDate = new Date(medical_history.CreatedAt).toLocaleDateString(
                  'en-GB',
                  {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  }
                );

                return (
                  <HistoryItem key={index}>
                    <DiagnosisName>
                      <DiagnosisLink to={`/diagnosis/${medical_history.DiagnosisHistoryID}`}>
                        {medical_history.DiagnosisName}
                      </DiagnosisLink>
                    </DiagnosisName>
                    <DiagnosisDate>{formattedDate}</DiagnosisDate>
                  </HistoryItem>
                );
              })
            ) : (
              <Text>No Medical History Was Found.</Text>
            )}
          </Section>
          <Section>
            <Title>Medications</Title>
            {medications && medications.length > 0 ? (
              medications.map((medication, index) => {
                const formattedDate = new Date(medication.CreatedAt).toLocaleDateString(
                  'en-GB',
                  {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  }
                );

                return (
                  <HistoryItem key={index}>
                    <DiagnosisName>{medication.MedicationName}</DiagnosisName>
                    <DiagnosisDate>{formattedDate}</DiagnosisDate>
                  </HistoryItem>
                );
              })
            ) : (
              <Text>No Medications Found.</Text>
            )}
          </Section>
          <Section>
            <Title>Doctors Following</Title>
            <List>
              {userFollowings && userFollowings.length > 0 ? (
                userFollowings.map((doctor, index) => <ListItem key={index}>{doctor.FirstName} {doctor.LastName}</ListItem>)
              ) : (
                <Text>No Doctors Following.</Text>
              )}
            </List>
          </Section>
        </LeftColumn>

        <RightColumn>
          <Section>
            <Title>Statistics</Title>
            <Statistic>
              <StatBox>
                <Subtitle>Appointments</Subtitle>
                <Text>{patientInfo.AppointmentCount || 0}</Text>
              </StatBox>
              <StatBox>
                <Subtitle>Doctors Visited</Subtitle>
                <Text>{patientInfo.DoctorsVisited || 0}</Text>
              </StatBox>
            </Statistic>
          </Section>
        </RightColumn>
      </BodyContainer>
    </MainContainer>
  );
}

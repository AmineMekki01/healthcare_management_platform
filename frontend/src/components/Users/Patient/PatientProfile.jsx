import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from './../../axiosConfig';
import {
  Header, Section, Title, Subtitle, Statistic, StatBox, Text, List, ListItem, ProfileImage, LeftColumn, RightColumn, MainContainer, BodyContainer, LocationContainer, LocationInfo, BreakingLine, FollowButton, DoctorInfoContainer, DoctorName, DoctorInfo
} from './../Doctor/styles/DoctorProfileStyles';

import { useParams } from 'react-router-dom';
import { AuthContext } from './../../Auth/AuthContext';

export default function PatientProfile() {
  const { patientId } = useParams();
  const [patientInfo, setPatientInfo] = useState({});
  const [userFollowings, setUserFollowings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { userType, userId } = useContext(AuthContext);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  console.log("userId : ", userId)
  const fetchPatientInfo = async () => {

    try {
      const response = await axios.get(`http://localhost:3001/api/v1/patients/${patientId}`);
      setPatientInfo(response.data)
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
      setError('An error occurred while fetching the patient information.');
    }
  };

  const fetchFollowings = async () => {
    const response = await axios.get(`http://localhost:3001/api/v1/patient-followings/${patientId}`);
    setUserFollowings(response.data.following_users)

    try {
      
    } catch (error) {
      console.log("Error while getting users followings :", error)
    }
  };

  useEffect(() => {
    fetchPatientInfo()
    fetchFollowings()
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const capitalizeText = (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };
  console.log("userFollowings : ", userFollowings)
  return (
    <MainContainer>
      <Header>
        <ProfileImage src={`http://localhost:3001/${patientInfo.ProfilePictureUrl}`} alt="Profile avatar" />
        <DoctorInfoContainer>
          <DoctorName>{capitalizeText(patientInfo.FirstName)} {patientInfo.LastName ? patientInfo.LastName.toUpperCase() : ''}</DoctorName>
          <DoctorInfo>{capitalizeText(patientInfo.CityName)} , {patientInfo.CountryName}</DoctorInfo>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {userId && userId !== patientId && (
              <FollowButton onClick={handleFollowClick} disabled={isProcessingFollow || isFollowing}>
                {isFollowing ? 'Following' : 'Follow'}
              </FollowButton>
            )}
          </div>
        </DoctorInfoContainer>
      </Header>

      <BodyContainer>
        <LeftColumn>
          <Section>
            <Title>Medical History</Title>
            <Text>{patientInfo.MedicalHistory || 'No Medical History Provided'}</Text>
          </Section>
          <Section>
            <Title>Current Medications</Title>
            <List>
              {patientInfo.Medications && patientInfo.Medications.length > 0 ? (
                patientInfo.Medications.map((medication, index) => <ListItem key={index}>{medication}</ListItem>)
              ) : (
                <Text>No Medications Provided.</Text>
              )}
            </List>
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

import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from './../../axiosConfig';
import {
  Header, Section, Title, Subtitle, Statistic, StatBox, Text, List, ListItem, ProfileImage, LeftColumn, RightColumn, MainContainer, BodyContainer, LocationContainer, LocationInfo, BreakingLine, DoctorInfo, DoctorName, FollowButton, DoctorInfoContainer, SocialIcon, SectionContainer, SectionTitle, Card, CardTitle, CardContent
} from './styles/DoctorProfileStyles';

import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { Instagram as InstagramIcon, Twitter as TwitterIcon, Facebook as FacebookIcon, Language as GlobeIcon, LocationOn as LocationIcon, Star as StarIcon } from '@mui/icons-material';


import { useParams } from 'react-router-dom';
import BookAppointment from '../Patient/BookAppointment';
import { AuthContext } from './../../Auth/AuthContext';
import AvailableAppointments from './AvailableAppointments';

export default function DoctorProfile() {
  const { doctorId } = useParams();
  const [doctorInfo, setDoctorInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followerCount, setFollowerCount] = useState(null);
  const { userType, userId} = useContext(AuthContext);
  const mapContainerRef = useRef(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  

  useEffect(() => {
    axios.get(`http://localhost:3001/api/v1/doctors/${doctorId}`)
      .then(response => {
        setDoctorInfo(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setLoading(false);
        setError('An error occurred while fetching the doctor information.');
      });
  }, [doctorId]);

  useEffect(() => {
    axios.get(`http://localhost:3001/api/v1/doctor-follow-count/${doctorId}`).then(response => {
      setFollowerCount(response.data.follower_count);
    })
    .catch(error => {
      console.error(error);
      setError('An error occurred while fetching the doctor follower count.');
    });
  }, [doctorId]);


  useEffect(() => {
    if (userId && userType && userType !== 'doctor') {
      axios.get(`http://localhost:3001/api/v1/is-following/${doctorId}`, {
        params: { follower_id: userId, follower_type: userType },
      })
        .then(response => {
          setIsFollowing(response.data.is_following);
        })
        .catch(error => {
          console.error(error);
        });
    }
  }, [doctorId, userId, userType]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const capitalizeText = (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };
  
  const doctorFullName = `${capitalizeText(doctorInfo.FirstName)} ${doctorInfo.LastName ? doctorInfo.LastName.toUpperCase() : ''}`;

  const handleFollowClick = () => {
    setIsProcessingFollow(true);

    axios.post('http://localhost:3001/api/v1/follow-doctor', {
        doctor_id: doctorId,
        follower_id: userId,
        follower_type: userType,
      }
    )
      .then(response => {
        setIsFollowing(true);
        setFollowerCount(prevCount => prevCount + 1);
      })
      .catch(error => {
        console.error(error);
        alert('An error occurred while trying to follow the doctor.');
      })
      .finally(() => {
        setIsProcessingFollow(false);
      });
  };

  const notCurrentUser = userId && userId !== doctorId;

  return (
    <MainContainer>
           <Header>
        <ProfileImage src={`${doctorInfo.ProfilePictureUrl}`} alt="Profile avatar" />

        <DoctorInfoContainer>
          <DoctorName>{doctorFullName}</DoctorName>
          <DoctorInfo>
            <StarIcon style={{ color: '#FFD700', verticalAlign: 'middle' }} />{' '}
            {doctorInfo.RatingScore || 'N/A'} ({doctorInfo.RatingCount || 0} reviews)
          </DoctorInfo>
          <DoctorInfo>
            <LocationIcon style={{ verticalAlign: 'middle' }} />{' '}
            {doctorInfo.CityName}, {doctorInfo.CountryName}
          </DoctorInfo>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
            {notCurrentUser && (
              <FollowButton onClick={handleFollowClick} disabled={isProcessingFollow || isFollowing}>
                {isFollowing ? 'Following' : 'Follow'}
              </FollowButton>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <SocialIcon href="#" target="_blank">
                <FacebookIcon />
              </SocialIcon>
              <SocialIcon href="#" target="_blank">
                <TwitterIcon />
              </SocialIcon>
              <SocialIcon href="#" target="_blank">
                <InstagramIcon />
              </SocialIcon>
              <SocialIcon href="#" target="_blank">
                <GlobeIcon />
              </SocialIcon>
            </div>
          </div>
        </DoctorInfoContainer>
      </Header>

      <BodyContainer>
        <LeftColumn>
          <Section>
            <Title>Intro</Title>
            <Text>{doctorInfo.Bio}</Text>
          </Section>

          <SectionContainer>
            <SectionTitle>Hospitals</SectionTitle>
            {doctorInfo.Hospitals && doctorInfo.Hospitals.length > 0 ? (
              doctorInfo.Hospitals.map((hospital, index) => (
                <Card key={index}>
                  <CardTitle>{hospital.hospital_name}</CardTitle>
                  <CardContent>
                    <p><strong>Role : </strong> {hospital.position}</p>
                    <p><strong>Dates : </strong> {hospital.start_date} <strong>To</strong> {hospital.end_date || 'Present'}</p>
                    <p><strong>Description : </strong> {hospital.description}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <CardContent>No affiliated hospitals listed.</CardContent>
            )}
          </SectionContainer>

          <SectionContainer>
            <SectionTitle>Organizations</SectionTitle>
            {doctorInfo.Organizations && doctorInfo.Organizations.length > 0 ? (
              doctorInfo.Organizations.map((organization, index) => (
                <Card key={index}>
                  <CardTitle>{organization.organization_name}</CardTitle>
                  <CardContent>
                    <p><strong>Role : </strong> {organization.role}</p>
                    <p><strong>Dates : </strong> {organization.start_date} <strong>To</strong> {organization.end_date || 'Present'}</p>
                    <p><strong>Description : </strong> {organization.description}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <CardContent>No affiliated organizations listed.</CardContent>
            )}
          </SectionContainer>

          <SectionContainer>
            <SectionTitle>Awards</SectionTitle>
              {doctorInfo.Awards && doctorInfo.Awards.length > 0 ? (
                doctorInfo.Awards.map((award, index) => (
                  <Card key={index}>
                    <CardTitle>{award.award_name}</CardTitle>
                    <CardContent>
                      <p><strong>Awarded on : </strong>{award.date_awarded}</p>
                      <p><strong>Issued by : </strong>{award.issuing_organization}</p>
                      <p><strong>Description : </strong>{award.description}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <CardContent>No Awards Information Provided.</CardContent>
              )}
          </SectionContainer>

          <SectionContainer>
            <SectionTitle>Certifications</SectionTitle>
              {doctorInfo.Certifications && doctorInfo.Certifications.length > 0 ? (
                doctorInfo.Certifications.map((certification, index) => (
                  <Card key={index}>
                    <CardTitle>{certification.certification_name}</CardTitle>
                    <CardContent>
                      <p><strong>Issued by : </strong>{certification.issued_by}</p>
                      <p><strong>Issued on : </strong>{certification.issue_date}</p>
                      {certification.expiration_date ? 
                      <p><strong>Expires on : </strong> {certification.expiration_date}</p> : <p></p>
                      }


                      <p><strong>Description : </strong>{certification.description}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <CardContent>No Certifications Information Provided.</CardContent>
              )}
          </SectionContainer>

        </LeftColumn>

        <RightColumn>
          {/* <Section>
            <Title>Statistics</Title>
            <Statistic>
              <StatBox>
                <Subtitle>Saved Lives</Subtitle>
                <Text>{"1,044"}</Text>
              </StatBox>
              <StatBox>
                <Subtitle>People Helped</Subtitle>
                <Text>{"1,632,547"}</Text>
              </StatBox>
              <StatBox>
                <Subtitle>Doctor Agrees</Subtitle>
                <Text>{"134"}</Text>
              </StatBox>
              <StatBox>
                <Subtitle>Thanks Received</Subtitle>
                <Text>{"500,654"}</Text>
              </StatBox>
            </Statistic>
          </Section> */}
          <Section>
            <Title>Languages</Title>
            <List>
              {doctorInfo.Languages && doctorInfo.Languages.length > 0 ? (
                doctorInfo.Languages.map((language, index) => (
                  <ListItem key={index}>
                    {language.language_name} - {language.proficiency_level}
                  </ListItem>
                ))
              ) : (
                <Text>No Languages Provided.</Text>
              )}
            </List>
          </Section>
        </RightColumn>
      </BodyContainer>

      {notCurrentUser && <AvailableAppointments doctorId={doctorId} doctorFullName={doctorFullName} />}
    </MainContainer>
  );
}
import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import {
  Header, Section, Title, Subtitle, Statistic, StatBox, Text, List, ListItem, Image, LeftColumn, RightColumn, MainContainer, BodyContainer, LocationContainer, LocationInfo, BreakingLine
} from './styles/DoctorProfileStyles';

import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { Instagram as InstagramIcon, Twitter as TwitterIcon, Facebook as FacebookIcon, Language as GlobeIcon } from '@mui/icons-material';

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

  const showFollowButton = userId && userId !== doctorId && userType !== 'doctor';


  return (
    <MainContainer>
      <Header>
        <Image src={`http://localhost:3001/${doctorInfo.ProfilePictureUrl}`} alt="Profile avatar" />
        <Title>Dr. {capitalizeText(doctorInfo.FirstName)} {doctorInfo.LastName && doctorInfo.LastName.toUpperCase()}</Title>
        <Subtitle>{capitalizeText(doctorInfo.Specialty)} - {doctorInfo.RatingScore} ({ doctorInfo.RatingCount })</Subtitle>
        <Subtitle>{doctorInfo.CityName} , { doctorInfo.CountryName }</Subtitle>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Subtitle>{followerCount} Followers</Subtitle>
          {showFollowButton && (
            <button
              onClick={handleFollowClick}
              disabled={isProcessingFollow || isFollowing}
              style={{
                padding: '10px 20px',
                backgroundColor: isFollowing ? 'gray' : '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: isProcessingFollow || isFollowing ? 'not-allowed' : 'pointer',
              }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </Header>

      <BodyContainer>
        <LeftColumn>
        
          <Section>
            <Title>Intro</Title>
            <Text>{doctorInfo.DoctorBio}</Text>
          </Section>
          <LocationContainer>
            <Title>I'm Located At</Title>
            <LocationInfo>{doctorInfo.Location}</LocationInfo>
            <div ref={mapContainerRef} style={{ width: '100%', 'maxWidth': '400px', maxHeight: '400px' }}>
              <LoadScript googleMapsApiKey="YOUR_API_KEY">
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{ lat: doctorInfo.Latitude, lng: doctorInfo.Longitude }}
                  zoom={14}
                >
                  <Marker position={{ lat: doctorInfo.Latitude, lng: doctorInfo.Longitude }} />
                </GoogleMap>
              </LoadScript>
            </div>
          </LocationContainer>
          <Section>
            <Title>My Education</Title>
            <List>
              {doctorInfo.Education && doctorInfo.Education.length > 0 ? (
                doctorInfo.Education.map((education, index) => <ListItem key={index}>{education}</ListItem>)
              ) : (
                <Text>No Education Information Provided.</Text>
              )}
            </List>
          </Section>
          <Section>
            <Title>My Experience</Title>
            <List>
              {doctorInfo.Experience && doctorInfo.Experience.length > 0 ? (
                doctorInfo.Experience.map((experience, index) => <ListItem key={index}>{experience}</ListItem>)
              ) : (
                <Text>No Experience Information Provided.</Text>
              )}
            </List>
          </Section>
          <Section>
            <Title>Certifications</Title>
            <List>
              {doctorInfo.Certifications && doctorInfo.Certifications.length > 0 ? (
                doctorInfo.Certifications.map((Certification, index) => <ListItem key={index}>{Certification}</ListItem>)
              ) : (
                <Text>No Certifications Information Provided.</Text>
              )}
            </List>
          </Section>
          <Section>
            <Title>Awards</Title>
            <List>
              {doctorInfo.Awards && doctorInfo.Awards.length > 0 ? (
                doctorInfo.Awards.map((Award, index) => <ListItem key={index}>{Award}</ListItem>)
              ) : (
                <Text>No Awards Information Provided.</Text>
              )}
            </List>
          </Section>

        </LeftColumn>
        <RightColumn>
          <Section>
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
          </Section>
          <Section>
            <Title>I'm Affiliated With</Title>
            <Subtitle>Hospitals</Subtitle>
            <List>
              {doctorInfo.Hospitals && doctorInfo.Hospitals.length > 0 ? (
                doctorInfo.Hospitals.map((hospital, index) => <ListItem key={index}>{hospital}</ListItem>)
              ) : (
                <Text>No affiliated Hospitals.</Text>
              )}
            </List>
            <BreakingLine />
            <Subtitle>Organizations</Subtitle>
            <List>
              {doctorInfo.Organizations && doctorInfo.Organizations.length > 0 ? (
                doctorInfo.Organizations.map((organization, index) => <ListItem key={index}>{organization}</ListItem>)
              ) : (
                <Text>No affiliated organizations.</Text>
              )}
            </List>
          </Section>

          <Section>  
            <Title>Languages</Title>
            <List>
              {doctorInfo.Languages && doctorInfo.Languages.length > 0 ? (
                doctorInfo.Languages.map((language, index) => <ListItem key={index}>{language}</ListItem>)
              ) : (
                <Text>No Languages Provided.</Text>
              )}
            </List>

          </Section>
          
        </RightColumn>
      </BodyContainer> 

      {userType === 'patient' && <AvailableAppointments doctorId={doctorId} doctorFullName={doctorFullName} />}

    </MainContainer>
  );
}
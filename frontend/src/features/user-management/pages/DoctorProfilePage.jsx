import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import UserProfile from '../components/UserProfile';
import { useUserManagement } from '../hooks/useUserManagement';
import { useAuth } from '../../auth/hooks/useAuth';
import { useFollow } from '../hooks/useFollow';
import AppointmentBooking from '../components/AppointmentBooking';

const DoctorProfileContainer = styled.div`
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

const BookingSection = styled.div`
  width: 100%;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

const SpecialtiesCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const SpecialtiesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SpecialtyTag = styled.span`
  display: inline-block;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border: 1px solid #667eea30;
  border-radius: 20px;
  font-size: 14px;
  color: #667eea;
  font-weight: 500;
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

const DoctorProfilePage = () => {
    const navigate = useNavigate();
  const { doctorId } = useParams();
  const { user: doctor, loading, error, fetchUser } = useUserManagement();

  const { currentUser } = useAuth();
  const { 
    isFollowing, 
    followerCount, 
    isFollowingInProgress,
    isUnfollowingInProgress,
    isCheckingStatus,
    followButtonDisabled,
    error: followError, 
    toggleFollow 
  } = useFollow(doctorId, currentUser);
  
  const [doctorStats, setDoctorStats] = useState({
    patients: 0,
    experience: 0,
    rating: 0,
    followers: 0
  });
  const [showBooking, setShowBooking] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const bookingRef = useRef(null);

  console.log("doctor :", doctor);
  const canBookAppointment = currentUser && currentUser.userId !== doctorId;
  const canFollowDoctor = currentUser && currentUser.userId !== doctorId;

  const doctorFields = [
    { key: 'firstName', label: 'First Name', type: 'text' },
    { key: 'lastName', label: 'Last Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phoneNumber', label: 'Phone', type: 'tel' },
    { key: 'username', label: 'Username', type: 'text' },
    { key: 'specialization', label: 'Specialization', type: 'text' },
    { key: 'licenseNumber', label: 'Medical License', type: 'text' },
    { key: 'experience', label: 'Years of Experience', type: 'text' },
    { key: 'qualification', label: 'Qualification', type: 'text' },
    { key: 'consultationFee', label: 'Consultation Fee', type: 'number' },
    { key: 'bio', label: 'Biography', type: 'textarea' },
    { key: 'dateOfBirth', label: 'Birth Date', type: 'date' },
    { key: 'gender', label: 'Gender', type: 'text' },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
    { key: 'zipCode', label: 'Zip Code', type: 'text' },
    { key: 'country', label: 'Country', type: 'text' },
  ];

  useEffect(() => {
    if (doctorId) {
      fetchUser(doctorId, 'doctor');
    }
  }, [doctorId, fetchUser]);

  useEffect(() => {
    if (doctor) {
      fetchDoctorStats();
    }
  }, [doctor, followerCount]);

  const fetchDoctorStats = () => {
    try {
      if (doctor) {
        setDoctorStats({
          patients: doctor?.totalReviews || 0,
          experience: parseInt(doctor?.experience) || 0,
          rating: doctor?.rating || 4.8,
          followers: followerCount || doctor?.totalReviews || 0
        });
      }
    } catch (error) {
      console.error('Error fetching doctor stats:', error);
      setDoctorStats({
        patients: 0,
        experience: 0,
        rating: 0,
        followers: 0
      });
    }
  };

  const handleProfileSave = (updatedDoctor) => {
    console.log('Doctor profile updated:', updatedDoctor);
  };

  const handleBookingComplete = (appointment) => {
    console.log('Appointment booked:', appointment);
    setShowBooking(false);
  };

  const toggleBooking = () => {
    const next = !showBooking;
    setActiveTab(next ? 'book' : 'profile');
    setShowBooking(next);
    setShowAppointments(false);
    if (next) {
      setTimeout(() => {
        if (bookingRef.current) {
          bookingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  };


  if (loading.user) {
    return <LoadingMessage>Loading doctor profile...</LoadingMessage>;
  }

  if (error.user) {
    return <ErrorMessage>Error loading doctor profile: {error.user}</ErrorMessage>;
  }

  if (!doctor) {
    return <ErrorMessage>Doctor not found</ErrorMessage>;
  }

  return (
    <DoctorProfileContainer>
      <ProfileGrid>
        <MainProfile>
          <UserProfile
            userId={doctorId}
            userType="doctor"
            user={doctor}
            editable={false}
            customFields={doctorFields}
            onSave={handleProfileSave}
            headerActions={[
              ...(canBookAppointment ? [{
                label: activeTab === 'book' ? 'Hide Booking' : 'Book Appointment',
                variant: 'primary',
                onClick: toggleBooking,
                small: true
              }] : []),
              ...(canFollowDoctor ? [{
                label: (isFollowingInProgress || isUnfollowingInProgress || isCheckingStatus) ? 'Loading...' : (isFollowing ? 'Unfollow' : 'Follow'),
                variant: isFollowing ? 'secondary' : 'primary',
                onClick: toggleFollow,
                disabled: followButtonDisabled,
                small: true
              }] : []),
              ...(currentUser && currentUser.userId !== doctorId ? [{
                label: 'Send Message',
                variant: 'secondary',
                onClick: () => navigate('/Messages'),
                small: true
              }] : [])
            ]}
          />
        </MainProfile>

        <Sidebar>
          {/* Doctor Statistics */}
          <StatsCard>
            <SectionTitle>Statistics</SectionTitle>
            <StatsGrid>
              <StatItem>
                <StatNumber>{doctorStats.patients || 0}</StatNumber>
                <StatLabel>Patients</StatLabel>
              </StatItem>
              <StatItem>
                <StatNumber>{doctorStats.experience || doctor?.experience || 0}</StatNumber>
                <StatLabel>Years Exp.</StatLabel>
              </StatItem>
              <StatItem>
                <StatNumber>{doctorStats.rating || doctor?.rating || '4.8'}</StatNumber>
                <StatLabel>Rating</StatLabel>
              </StatItem>
              <StatItem>
                <StatNumber>{doctorStats.followers || 0}</StatNumber>
                <StatLabel>Followers</StatLabel>
              </StatItem>
            </StatsGrid>
          </StatsCard>

          {/* Specialties */}
          {doctor?.specialization && (
            <SpecialtiesCard>
              <SectionTitle>Specialization</SectionTitle>
              <SpecialtiesList>
                <SpecialtyTag>{doctor.specialization}</SpecialtyTag>
              </SpecialtiesList>
            </SpecialtiesCard>
          )}

          {/* Hospitals */}
          {doctor?.hospitals && doctor.hospitals.length > 0 && (
            <SpecialtiesCard>
              <SectionTitle>Hospitals</SectionTitle>
              <SpecialtiesList>
                {doctor.hospitals.map((hospital, index) => (
                  <SpecialtyTag key={index}>{hospital.hospital_name || hospital.name}</SpecialtyTag>
                ))}
              </SpecialtiesList>
            </SpecialtiesCard>
          )}

          {/* Organizations */}
          {doctor?.organizations && doctor.organizations.length > 0 && (
            <SpecialtiesCard>
              <SectionTitle>Organizations</SectionTitle>
              <SpecialtiesList>
                {doctor.organizations.map((org, index) => (
                  <SpecialtyTag key={index}>{org.organization_name || org.name}</SpecialtyTag>
                ))}
              </SpecialtiesList>
            </SpecialtiesCard>
          )}

          {/* Languages */}
          {doctor?.languages && doctor.languages.length > 0 && (
            <SpecialtiesCard>
              <SectionTitle>Languages</SectionTitle>
              <SpecialtiesList>
                {doctor.languages.map((lang, index) => (
                  <SpecialtyTag key={index}>{lang.language_name || lang.name} ({lang.proficiency_level || lang.level})</SpecialtyTag>
                ))}
              </SpecialtiesList>
            </SpecialtiesCard>
          )}

          {/* Quick Actions moved into header */}
        </Sidebar>
      </ProfileGrid>

      {showBooking && canBookAppointment && (
        <BookingSection ref={bookingRef}>
          <AppointmentBooking
            doctorId={doctorId}
            doctor={doctor}
            currentUser={currentUser}
            onBookingComplete={handleBookingComplete}
          />
        </BookingSection>
      )}

    </DoctorProfileContainer>
  );
};

export default DoctorProfilePage;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import UserProfile from '../components/UserProfile';
import { useUserManagement } from '../hooks/useUserManagement';
import { useAuth } from '../../auth/hooks/useAuth';
import { useFollow } from '../hooks/useFollow';
import AppointmentBooking from '../components/AppointmentBooking';
import { getLocalizedSpecialty } from '../../search/utils/translationMaps';

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

const SpecialtyTag = styled.div`
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
  const { t, i18n } = useTranslation('userManagement');
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const { user: doctor, loading, error, fetchUser } = useUserManagement();

  const isArabic = (i18n?.language || '').toLowerCase().startsWith('ar');
  const isFrench = (i18n?.language || '').toLowerCase().startsWith('fr');
  const languageCode = isArabic ? 'ar' : (isFrench ? 'fr' : 'en');

  const getExperienceNumber = (value) => {
    if (value == null) return null;
    if (typeof value === 'number') return value;
    const m = String(value).match(/(\d+)/);
    return m ? Number(m[1]) : null;
  };

  const getArabicLanguageName = (value) => {
    const v = (value || '').toLowerCase();
    if (v === 'arabic') return 'العربية';
    if (v === 'french') return 'الفرنسية';
    if (v === 'english') return 'الإنجليزية';
    if (v === 'tamazight') return 'الأمازيغية';
    return value;
  };

  const getFrenchLanguageName = (value) => {
    const v = (value || '').toLowerCase();
    if (v === 'arabic') return 'Arabe';
    if (v === 'french') return 'Français';
    if (v === 'english') return 'Anglais';
    if (v === 'tamazight') return 'Amazigh';
    return value;
  };

  const getArabicProficiency = (value) => {
    const v = (value || '').toLowerCase();
    if (v === 'basic') return 'مبتدئ';
    if (v === 'intermediate') return 'متوسط';
    if (v === 'fluent') return 'طليق';
    if (v === 'native') return 'اللغة الأم';
    return value;
  };

  const getFrenchProficiency = (value) => {
    const v = (value || '').toLowerCase();
    if (v === 'basic') return 'Débutant';
    if (v === 'intermediate') return 'Intermédiaire';
    if (v === 'fluent') return 'Courant';
    if (v === 'native') return 'Langue maternelle';
    return value;
  };

  const { currentUser } = useAuth();
  const {
    followUser,
    unfollowUser,
    isFollowing,
    followLoading,
    followerCount
  } = useFollow(doctorId, currentUser); 

  const notAvailableText = t('common.notAvailable', { defaultValue: 'N/A' });
  const doctorStats = {
    patients: doctor?.patients || notAvailableText,
    experience: (isArabic || isFrench)
      ? (getExperienceNumber(doctor?.experience) ?? notAvailableText)
      : (doctor?.experience || notAvailableText),
    rating: doctor?.ratingScore || notAvailableText,
    followersCount: followerCount || notAvailableText
  };
  const [showBooking, setShowBooking] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const bookingRef = useRef(null);

  const canBookAppointment = currentUser && currentUser.userId !== doctorId;
  const canFollowDoctor = currentUser && currentUser.userId !== doctorId;

  const doctorFields = [
    { key: 'firstName', label: t('doctorProfile.fields.firstName'), type: 'text' },
    { key: 'lastName', label: t('doctorProfile.fields.lastName'), type: 'text' },
    { key: 'clinicPhoneNumber', label: t('doctorProfile.fields.clinicPhoneNumber'), type: 'tel' },
    { key: 'specialty', label: t('doctorProfile.fields.specialty'), type: 'text' },
    { key: 'experience', label: t('doctorProfile.fields.experience'), type: 'text' },
    { key: 'consultationFee', label: t('doctorProfile.fields.consultationFee'), type: 'number' },
    { key: 'bio', label: t('doctorProfile.fields.bio'), type: 'textarea' },
    { key: 'streetAddress', label: t('doctorProfile.fields.address'), type: 'text' },
    { key: 'cityName', label: t('doctorProfile.fields.city'), type: 'text' },
    { key: 'stateName', label: t('doctorProfile.fields.state'), type: 'text' },
    { key: 'zipCode', label: t('doctorProfile.fields.zipCode'), type: 'text' },
    { key: 'countryName', label: t('doctorProfile.fields.country'), type: 'text' },
  ];


  useEffect(() => {
    if (doctorId) {
      fetchUser(doctorId, 'doctor');
    }
  }, [doctorId, fetchUser]);

  const handleProfileSave = (updatedDoctor) => {
    console.log('Doctor profile updated:', updatedDoctor);
  };

  const handleBookingComplete = (appointment) => {
    console.log('Appointment booked:', appointment);
    // setShowBooking(false);
  };

  const toggleBooking = () => {
    const next = !showBooking;
    setActiveTab(next ? 'book' : 'profile');
    setShowBooking(next);
    if (next) {
      setTimeout(() => {
        try {
          if (bookingRef.current) {
            bookingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } catch (error) {
          console.warn('Scroll error (likely browser extension interference):', error);
        }
      }, 50);
    }
  };

  const toggleFollow = async () => {
    try {
      if (isFollowing) {
        console.log('Unfollowing doctor:', doctorId);
        await unfollowUser();
      } else {
        console.log('Following doctor:', doctorId);
        await followUser();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };


  if (loading.user) {
    return <LoadingMessage>{t('doctorProfile.messages.loading')}</LoadingMessage>;
  }

  if (error.user) {
    return <ErrorMessage>{t('doctorProfile.messages.loadError')}: {error.user}</ErrorMessage>;
  }

  if (!doctor) {
    return <ErrorMessage>{t('doctorProfile.messages.notFound')}</ErrorMessage>;
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
                label: activeTab === 'book' ? t('doctorProfile.actions.hideBooking') : t('doctorProfile.actions.bookAppointment'),
                variant: 'primary',
                onClick: toggleBooking,
                small: true
              }] : []),
              ...(canFollowDoctor ? [{
                label: followLoading ? t('common.loading') : (isFollowing ? t('doctorProfile.actions.unfollow') : t('doctorProfile.actions.follow')),
                variant: isFollowing ? 'secondary' : 'primary',
                onClick: toggleFollow,
                disabled: followLoading,
                small: true
              }] : []),
              ...(currentUser && currentUser.userId !== doctorId ? [{
                label: t('doctorProfile.actions.message'),
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
            <SectionTitle>{t('doctorProfile.sections.statistics')}</SectionTitle>
            <StatsGrid>
              <StatItem>
                <StatNumber>{doctorStats.patients}</StatNumber>
                <StatLabel>{t('doctorProfile.stats.patients')}</StatLabel>
              </StatItem>
              <StatItem>
                <StatNumber>{doctorStats.experience}</StatNumber>
                <StatLabel>{t('doctorProfile.stats.experience')}</StatLabel>
              </StatItem>
              <StatItem>
                <StatNumber>{doctorStats.rating}</StatNumber>
                <StatLabel>{t('doctorProfile.stats.rating')}</StatLabel>
              </StatItem>
              <StatItem>
                <StatNumber>{doctorStats.followersCount}</StatNumber>
                <StatLabel>{t('doctorProfile.stats.followers')}</StatLabel>
              </StatItem>
            </StatsGrid>
          </StatsCard>

          {/* Specialties */}
          {doctor?.specialty && (
            <SpecialtiesCard>
              <SectionTitle>{t('doctorProfile.sections.specialties')}</SectionTitle>
              <SpecialtiesList>
                <SpecialtyTag>
                  {languageCode === 'en'
                    ? doctor.specialty
                    : (getLocalizedSpecialty(doctor.specialty, languageCode) || doctor.specialty)}
                </SpecialtyTag>
              </SpecialtiesList>
            </SpecialtiesCard>
          )}

          {/* Hospitals */}
          {doctor?.hospitals && doctor.hospitals.length > 0 && (
            <SpecialtiesCard>
              <SectionTitle>{t('doctorProfile.sections.hospitals')}</SectionTitle>
              <SpecialtiesList>
                {doctor.hospitals.map((hospital, index) => (
                  <SpecialtyTag key={index}>
                    <p>
                      {isArabic ? (hospital.hospitalNameAr || hospital.hospitalName) : hospital.hospitalName}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                      {isArabic ? (hospital.positionAr || hospital.position) : hospital.position}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                      {hospital.startDate} - {hospital.endDate}
                    </p>

                    {(isArabic ? hospital.descriptionAr : hospital.description) && (
                      <p style={{ fontSize: '12px', color: '#64748b' }}>
                        {isArabic ? (hospital.descriptionAr || hospital.description) : hospital.description}
                      </p>
                    )}

                  </SpecialtyTag>
                ))}
              </SpecialtiesList>
            </SpecialtiesCard>
          )}

          {/* Certifications */}
          {doctor?.certifications && doctor.certifications.length > 0 && (
            <SpecialtiesCard>
              <SectionTitle>{t('doctorProfile.sections.certifications')}</SectionTitle>
              <SpecialtiesList>
                {doctor.certifications.map((cert, index) => (
                  <SpecialtyTag key={index}>
                    {isArabic ? (cert.certificationNameAr || cert.certificationName) : cert.certificationName}
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                      {t('doctorProfile.fields.issuedBy', { defaultValue: 'Issued by' })}: {isArabic ? (cert.issuedByAr || cert.issuedBy) : cert.issuedBy}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                      {cert.issueDate} - {cert.expirationDate}
                    </p>

                    {(isArabic ? cert.descriptionAr : cert.description) && (
                      <p style={{ fontSize: '12px', color: '#64748b' }}>
                        {isArabic ? (cert.descriptionAr || cert.description) : cert.description}
                      </p>
                    )}
                  </SpecialtyTag>
                ))}
              </SpecialtiesList>
            </SpecialtiesCard>
          )}

          {/* Languages */}
          {doctor?.languages && doctor.languages.length > 0 && (
            <SpecialtiesCard>
              <SectionTitle>{t('doctorProfile.sections.languages')}</SectionTitle>
              <SpecialtiesList>
                {doctor.languages.map((lang, index) => (
                  <SpecialtyTag key={index}>
                    <p>
                      {isArabic
                        ? (lang.languageNameAr || getArabicLanguageName(lang.languageName) || lang.languageName)
                        : isFrench
                          ? (getFrenchLanguageName(lang.languageName) || lang.languageName)
                        : lang.languageName}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                      {isArabic
                        ? (lang.proficiencyLevelAr || getArabicProficiency(lang.proficiencyLevel) || lang.proficiencyLevel)
                        : isFrench
                          ? (getFrenchProficiency(lang.proficiencyLevel) || lang.proficiencyLevel)
                        : lang.proficiencyLevel}
                    </p>
                  </SpecialtyTag>
                ))}
              </SpecialtiesList>
            </SpecialtiesCard>
          )}

          {/* Awards */}
          {doctor?.awards && doctor.awards.length > 0 && (
            <SpecialtiesCard>
              <SectionTitle>{t('doctorProfile.sections.awards')}</SectionTitle>
              <SpecialtiesList>
                {doctor.awards.map((award, index) => (
                  <SpecialtyTag key={index}>
                    <p>{isArabic ? (award.awardNameAr || award.awardName) : award.awardName}</p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                      {award.dateAwarded}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                      {t('doctorProfile.fields.awardedBy', { defaultValue: 'Awarded by' })}: {isArabic ? (award.issuingOrganizationAr || award.issuingOrganization) : award.issuingOrganization}
                    </p>
                    {(isArabic ? award.descriptionAr : award.description) && (
                      <p style={{ fontSize: '12px', color: '#64748b' }}>
                        {isArabic ? (award.descriptionAr || award.description) : award.description}
                      </p>
                    )}
                  </SpecialtyTag>
                ))}
              </SpecialtiesList>
            </SpecialtiesCard>
          )}

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

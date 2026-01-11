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
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
  overflow-x: hidden;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  margin-bottom: 24px;
  width: 100%;
  min-width: 0;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const MainProfile = styled.div`
  grid-column: 1;
  min-width: 0;
`;

const Sidebar = styled.div`
  grid-column: 2;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  align-self: start;
  position: sticky;
  top: 24px;
  
  @media (max-width: 768px) {
    grid-column: 1;
    position: static;
    top: auto;
  }
`;

const BookingSection = styled.div`
  width: 100%;
  margin-top: 24px;
`;

const MobileStatsWrapper = styled.div`
  position: relative;
  max-width: 100%;
  min-width: 0;
`;

const MobileScrollButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.95);
  color: #1f2937;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  z-index: 2;

  &:not(:disabled):hover {
    transform: translateY(-50%) scale(1.03);
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.16);
  }

  &:not(:disabled):active {
    transform: translateY(-50%) scale(0.98);
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
    box-shadow: none;
  }

  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileScrollButtonLeft = styled(MobileScrollButton)`
  left: 4px;
`;

const MobileScrollButtonRight = styled(MobileScrollButton)`
  right: 4px;
`;

const MobileScrollFade = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 44px;
  pointer-events: none;
  z-index: 1;

  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileScrollFadeLeft = styled(MobileScrollFade)`
  left: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0) 100%);
`;

const MobileScrollFadeRight = styled(MobileScrollFade)`
  right: 0;
  background: linear-gradient(270deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0) 100%);
`;

const MobileStatsBar = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  max-width: 100%;
  padding-left: 6px;
  padding-right: 6px;
  padding-bottom: 2px;
  -webkit-overflow-scrolling: touch;

  overscroll-behavior-x: contain;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const MobileStatChip = styled.div`
  flex: 0 0 auto;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(102, 126, 234, 0.2);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  min-width: 120px;
  max-width: 220px;
`;

const MobileStatValue = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: #1f2937;
  line-height: 1.1;
`;

const MobileStatLabel = styled.div`
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  line-height: 1.1;
`;

const StatsCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);

  @media (max-width: 768px) {
    display: none;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    gap: 12px;
  }
`;

const StatItem = styled.div`
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;

  @media (max-width: 768px) {
    padding: 14px;
  }
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
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);

  @media (max-width: 768px) {
    padding: 18px;
  }
`;

const SpecialtiesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
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

  p {
    margin: 0;
    line-height: 1.35;
  }

  p:not(:first-child) {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
  }
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

let rtlScrollBehavior;

const getScrollMax = (el) => {
  if (!el) return 0;
  return Math.max(0, el.scrollWidth - el.clientWidth);
};

const detectRtlScrollBehavior = () => {
  if (rtlScrollBehavior) return rtlScrollBehavior;
  if (typeof document === 'undefined') {
    rtlScrollBehavior = 'positive-descending';
    return rtlScrollBehavior;
  }

  const div = document.createElement('div');
  div.dir = 'rtl';
  div.style.width = '10px';
  div.style.height = '10px';
  div.style.overflow = 'scroll';
  div.style.position = 'absolute';
  div.style.top = '-9999px';

  const inner = document.createElement('div');
  inner.style.width = '20px';
  inner.style.height = '10px';
  div.appendChild(inner);
  document.body.appendChild(div);

  const max = getScrollMax(div);
  const start = div.scrollLeft;

  if (start === 0) {
    div.scrollLeft = 1;
    rtlScrollBehavior = div.scrollLeft === 0 ? 'negative' : 'positive-ascending';
  } else if (start === max) {
    rtlScrollBehavior = 'positive-descending';
  } else {
    rtlScrollBehavior = start > 0 ? 'positive-descending' : 'negative';
  }

  document.body.removeChild(div);
  return rtlScrollBehavior;
};

const getLeftBasedScroll = (el) => {
  if (!el) return 0;
  const max = getScrollMax(el);
  const dir = typeof window !== 'undefined' ? window.getComputedStyle(el).direction : 'ltr';
  if (dir !== 'rtl') return el.scrollLeft;

  const behavior = detectRtlScrollBehavior();
  if (behavior === 'negative') return max + el.scrollLeft;
  if (behavior === 'positive-ascending') return max - el.scrollLeft;
  return el.scrollLeft;
};

const scrollToLeftBased = (el, leftBased, behavior = 'smooth') => {
  if (!el) return;
  const max = getScrollMax(el);
  const clamped = Math.max(0, Math.min(leftBased, max));
  const dir = typeof window !== 'undefined' ? window.getComputedStyle(el).direction : 'ltr';

  let target;
  if (dir !== 'rtl') {
    target = clamped;
  } else {
    const rtlBehaviorDetected = detectRtlScrollBehavior();
    if (rtlBehaviorDetected === 'negative') target = clamped - max;
    else if (rtlBehaviorDetected === 'positive-ascending') target = max - clamped;
    else target = clamped;
  }

  try {
    el.scrollTo({ left: target, behavior });
  } catch (e) {
    el.scrollLeft = target;
  }
};

const DoctorProfilePage = () => {
  const { t, i18n } = useTranslation('userManagement');
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const { user: doctor, loading, error, fetchUser } = useUserManagement();

  const statsBarRef = useRef(null);
  const [canScrollStatsLeft, setCanScrollStatsLeft] = useState(false);
  const [canScrollStatsRight, setCanScrollStatsRight] = useState(false);

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

  const updateStatsScrollState = useCallback(() => {
    const el = statsBarRef.current;
    if (!el) return;

    const max = getScrollMax(el);
    const leftBased = getLeftBasedScroll(el);
    setCanScrollStatsLeft(leftBased > 0);
    setCanScrollStatsRight(max > 1 && leftBased < max - 1);
  }, []);

  const scrollStatsBy = useCallback((direction) => {
    const el = statsBarRef.current;
    if (!el) return;

    const amount = Math.max(180, Math.round(el.clientWidth * 0.7));
    const current = getLeftBasedScroll(el);
    scrollToLeftBased(el, current + direction * amount, 'smooth');
  }, []);

  useEffect(() => {
    updateStatsScrollState();
    const onResize = () => updateStatsScrollState();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateStatsScrollState]);

  useEffect(() => {
    const tmr = setTimeout(() => updateStatsScrollState(), 0);
    return () => clearTimeout(tmr);
  }, [doctor, updateStatsScrollState]);

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
            headerBottom={(
              <MobileStatsWrapper>
                {canScrollStatsLeft ? <MobileScrollFadeLeft /> : null}
                {canScrollStatsRight ? <MobileScrollFadeRight /> : null}

                <MobileScrollButtonLeft
                  type="button"
                  aria-label={t('common.previous', { defaultValue: 'Previous' })}
                  onClick={() => scrollStatsBy(-1)}
                  disabled={!canScrollStatsLeft}
                >
                  ‹
                </MobileScrollButtonLeft>

                <MobileScrollButtonRight
                  type="button"
                  aria-label={t('common.next', { defaultValue: 'Next' })}
                  onClick={() => scrollStatsBy(1)}
                  disabled={!canScrollStatsRight}
                >
                  ›
                </MobileScrollButtonRight>

                <MobileStatsBar ref={statsBarRef} onScroll={updateStatsScrollState}>
                  <MobileStatChip>
                    <MobileStatValue>{doctorStats.patients}</MobileStatValue>
                    <MobileStatLabel>{t('doctorProfile.stats.patients')}</MobileStatLabel>
                  </MobileStatChip>
                  <MobileStatChip>
                    <MobileStatValue>{doctorStats.experience}</MobileStatValue>
                    <MobileStatLabel>{t('doctorProfile.stats.experience')}</MobileStatLabel>
                  </MobileStatChip>
                  <MobileStatChip>
                    <MobileStatValue>{doctorStats.rating}</MobileStatValue>
                    <MobileStatLabel>{t('doctorProfile.stats.rating')}</MobileStatLabel>
                  </MobileStatChip>
                  <MobileStatChip>
                    <MobileStatValue>{doctorStats.followersCount}</MobileStatValue>
                    <MobileStatLabel>{t('doctorProfile.stats.followers')}</MobileStatLabel>
                  </MobileStatChip>
                </MobileStatsBar>
              </MobileStatsWrapper>
            )}
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

    </DoctorProfileContainer>
  );
};

export default DoctorProfilePage;

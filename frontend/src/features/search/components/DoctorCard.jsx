import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CardContainer, TopSection, DoctorImage, NameSpecialtyContainer, DoctorName, InfoContainer, DoctorInfo, DoctorRating, ButtonContainer, RatingContainer, NumberOfRaters, BadgeContainer, VerifiedBadge, ExperienceBadge, SpecialtyTag, LocationInfo, ContactButton, BookButton, AvailabilityBanner, AvailabilityLeft, AvailabilityIcon, AvailabilityLabel, AvailabilityRight, AvailabilityDate, AvailabilityTime } from '../styles/DoctorCardStyles';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaMapMarkerAlt, FaStar, FaShare, FaCheckCircle, FaHeart, FaRegHeart, FaClock } from 'react-icons/fa';

const DoctorCard = ({
  doctorId,
  firstName,
  lastName,
  specialty,
  experience,
  doctorRating,
  location,
  profilePictureUrl,
  ratingCount,
  username,
  doctor
}) => {
  const { t, i18n } = useTranslation(['search', 'medical']);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  const data = doctor || {
    doctorId: doctorId,
    userId: doctorId,
    firstName: firstName,
    lastName: lastName,
    specialty: specialty,
    experience: experience,
    doctorRating: doctorRating,
    location: location,
    profilePictureUrl: profilePictureUrl,
    ratingCount: ratingCount,
    username: username,
  };

  const isArabic = (i18n?.language || '').toLowerCase().startsWith('ar');
  const isFrench = (i18n?.language || '').toLowerCase().startsWith('fr');
  const displayFirstName = isArabic ? data.firstNameAr : data.firstName;
  const displayLastName = isArabic ? data.lastNameAr : data.lastName;
  const displaySpecialty = data.localizedSpecialty || data.specialty;
  
  const displayLocation = isArabic ? data.locationAr : isFrench ? data.locationFr : data.location;

  const doctorName = `${displayFirstName || ''} ${displayLastName || ''}`.trim();
  const doctorLabel = doctorName
    ? t('labels.doctor', { ns: 'medical', name: doctorName, defaultValue: `Dr. ${doctorName}` })
    : t('doctorCard.unknownDoctor', { defaultValue: 'Unknown Doctor' });

  const getNextSlotLabels = (start, end) => {
    if (!start) return null;
    const startDate = start instanceof Date ? start : new Date(start);
    if (Number.isNaN(startDate.getTime())) return null;
    const endDate = end ? (end instanceof Date ? end : new Date(end)) : null;

    try {
      const locale = i18n?.language || undefined;
      const dateFmt = new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      const timeFmt = new Intl.DateTimeFormat(locale, { timeStyle: 'short' });

      const dateLabel = dateFmt.format(startDate);
      let timeLabel = timeFmt.format(startDate);
      if (endDate && !Number.isNaN(endDate.getTime())) {
        timeLabel = `${timeLabel} – ${timeFmt.format(endDate)}`;
      }

      return { dateLabel, timeLabel };
    } catch {
      return {
        dateLabel: startDate.toLocaleDateString(),
        timeLabel: startDate.toLocaleTimeString(),
      };
    }
  };

  const experienceYears = Number(data.experience || 0);
  const hasExperience = experienceYears > 0;
  const experienceText = hasExperience
    ? t('doctorCard.yearsExperience', { count: experienceYears })
    : t('doctorCard.newPractitioner');

  const reviewsText = data.ratingCount > 0
    ? t('doctorCard.reviewsCount', { count: data.ratingCount })
    : t('doctorCard.noReviews');

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: doctorLabel,
        text: `Check out ${doctorLabel}, ${displaySpecialty || displaySpecialty} specialist`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const formatLocation = (location) => {
    console.log(location);
    if (!location) return t('doctorCard.locationNotSpecified');
    return location;
  };

  const getSpecialtyColor = (specialty) => {
    if (!specialty) return { primary: '#667eea', secondary: '#764ba2' };
    
    const specialtyLower = specialty.toLowerCase();
    
    const specialtyColors = {
      'cardiology': { primary: '#e53e3e', secondary: '#c53030' },
      'cardiologist': { primary: '#e53e3e', secondary: '#c53030' },
      
      'neurology': { primary: '#805ad5', secondary: '#6b46c1' },
      'neurologist': { primary: '#805ad5', secondary: '#6b46c1' },
      'psychiatry': { primary: '#9f7aea', secondary: '#805ad5' },
      'psychiatrist': { primary: '#9f7aea', secondary: '#805ad5' },
      
      'dermatology': { primary: '#ed8936', secondary: '#dd6b20' },
      'dermatologist': { primary: '#ed8936', secondary: '#dd6b20' },
      
      'pediatrics': { primary: '#48bb78', secondary: '#38a169' },
      'pediatrician': { primary: '#48bb78', secondary: '#38a169' },
      
      'orthopedics': { primary: '#a0522d', secondary: '#8b4513' },
      'orthopedist': { primary: '#a0522d', secondary: '#8b4513' },
      
      'surgery': { primary: '#2b6cb0', secondary: '#2c5282' },
      'surgeon': { primary: '#2b6cb0', secondary: '#2c5282' },
      
      'internal medicine': { primary: '#319795', secondary: '#2c7a7b' },
      'internal': { primary: '#319795', secondary: '#2c7a7b' },
      
      'gynecology': { primary: '#d53f8c', secondary: '#b83280' },
      'gynecologist': { primary: '#d53f8c', secondary: '#b83280' },
      'obstetrics': { primary: '#ed64a6', secondary: '#d53f8c' },
      'obstetrician': { primary: '#ed64a6', secondary: '#d53f8c' },
      
      'radiology': { primary: '#4a5568', secondary: '#2d3748' },
      'radiologist': { primary: '#4a5568', secondary: '#2d3748' },
      'radiologue': { primary: '#4a5568', secondary: '#2d3748' },
      
      'dentist': { primary: '#4299e1', secondary: '#3182ce' },
      'dental': { primary: '#4299e1', secondary: '#3182ce' },
      
      'emergency': { primary: '#f56500', secondary: '#dd6b20' },
      'emergency medicine': { primary: '#f56500', secondary: '#dd6b20' },
      
      'oncology': { primary: '#553c9a', secondary: '#44337a' },
      'oncologist': { primary: '#553c9a', secondary: '#44337a' },
      
      'ophthalmology': { primary: '#9f7aea', secondary: '#805ad5' },
      'ophthalmologist': { primary: '#9f7aea', secondary: '#805ad5' },
      
      'anesthesiology': { primary: '#718096', secondary: '#4a5568' },
      'anesthesiologist': { primary: '#718096', secondary: '#4a5568' },
    };
    
    for (const [key, colors] of Object.entries(specialtyColors)) {
      if (specialtyLower.includes(key)) {
        return colors;
      }
    }
    
    return { primary: '#667eea', secondary: '#764ba2' };
  };

  const specialtyColors = getSpecialtyColor(displaySpecialty || displaySpecialty);
  const doctorId_final = data.doctorId || data.userId || doctorId;
  const nextSlot = getNextSlotLabels(data.nextAvailableSlotStart, data.nextAvailableSlotEnd);
  const hasNextSlot = Boolean(nextSlot);

  return (
    <CardContainer specialtyColors={specialtyColors}>
      <TopSection specialtyColors={specialtyColors}>
        <BadgeContainer>
          <VerifiedBadge>
            <FaCheckCircle /> {t('doctorCard.verified')}
          </VerifiedBadge>
          <ExperienceBadge>
            {experienceText}
          </ExperienceBadge>
        </BadgeContainer>
        
        <DoctorImage 
          src={data.profilePictureUrl} 
          alt={`${displayFirstName || ''} ${displayLastName || ''}`}
          onError={handleImageError}
        />
        
        <NameSpecialtyContainer>
          <DoctorName>{doctorLabel}</DoctorName>
          <SpecialtyTag specialtyColors={specialtyColors}>{displaySpecialty || displaySpecialty}</SpecialtyTag>
        </NameSpecialtyContainer>
      </TopSection>
      
      <InfoContainer>
        <AvailabilityBanner available={hasNextSlot} specialtyColors={specialtyColors}>
          <AvailabilityLeft>
            <AvailabilityIcon available={hasNextSlot} specialtyColors={specialtyColors}>
              <FaClock />
            </AvailabilityIcon>
            <AvailabilityLabel available={hasNextSlot}>
              {hasNextSlot ? t('doctorCard.nextAvailableLabel') : t('doctorCard.noAvailability')}
            </AvailabilityLabel>
          </AvailabilityLeft>

          {hasNextSlot && (
            <AvailabilityRight>
              <AvailabilityDate>{nextSlot.dateLabel}</AvailabilityDate>
              <AvailabilityTime specialtyColors={specialtyColors}>{nextSlot.timeLabel}</AvailabilityTime>
            </AvailabilityRight>
          )}
        </AvailabilityBanner>

        <div>
          <LocationInfo>
            <FaMapMarkerAlt />
            <span>{formatLocation(displayLocation || displayLocation)}</span>
          </LocationInfo>
        </div>
        
        <RatingContainer>
          <DoctorInfo specialtyColors={specialtyColors}>
            <FaStar style={{ color: '#f6ad55' }} />
            <DoctorRating>{data.ratingScore || data.rating || data.doctorRating ? Number(data.ratingScore || data.rating || data.doctorRating).toFixed(1) : 'N/A'}</DoctorRating>
          </DoctorInfo>
          <NumberOfRaters>({reviewsText})</NumberOfRaters>
        </RatingContainer>
      </InfoContainer>
      
      <ButtonContainer>
        <ContactButton onClick={toggleFavorite} className={isFavorite ? 'favorite' : ''} specialtyColors={specialtyColors}>
          {isFavorite ? <FaHeart /> : <FaRegHeart />}
        </ContactButton>
        
        <BookButton specialtyColors={specialtyColors}>
          <Link to={`/doctor-profile/${doctorId_final}`}>
            {t('doctorCard.bookAppointment')}
          </Link>
        </BookButton>
        
        <ContactButton onClick={handleShare} specialtyColors={specialtyColors}>
          <FaShare />
        </ContactButton>
      </ButtonContainer>
    </CardContainer>
  );
};

export default DoctorCard;

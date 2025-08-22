import React, { useState } from 'react';
import { CardContainer, TopSection, DoctorImage, NameSpecialtyContainer, DoctorName, InfoContainer, DoctorInfo, DoctorRating, ButtonContainer, RatingContainer, NumberOfRaters, BadgeContainer, VerifiedBadge, ExperienceBadge, SpecialtyTag, LocationInfo, ContactButton, BookButton } from '../styles/DoctorCardStyles';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaMapMarkerAlt, FaStar, FaShare, FaCheckCircle,FaHeart, FaRegHeart } from 'react-icons/fa';

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
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  const data = doctor || {
    doctorId: doctorId,
    userId: doctorId,
    firstName: firstName,
    lastName: lastName,
    firstName,
    lastName,
    specialty: specialty,
    specialty,
    experience: experience,
    experience,
    ratingScore: doctorRating,
    rating: doctorRating,
    doctorRating,
    location: location,
    location,
    profilePictureUrl: profilePictureUrl,
    profilePictureUrl,
    ratingCount: ratingCount,
    ratingCount,
    username: username,
    username
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Dr. ${data.firstName || data.firstName} ${data.lastName || data.lastName}`,
        text: `Check out Dr. ${data.firstName || data.firstName} ${data.lastName || data.lastName}, ${data.specialty || data.specialty} specialist`,
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
    if (!location) return 'location not specified';
    return location.length > 30 ? location.substring(0, 30) + '...' : location;
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

  const specialtyColors = getSpecialtyColor(data.specialty || data.specialty);
  const doctorId_final = data.doctorId || data.userId || doctorId;

  return (
    <CardContainer specialtyColors={specialtyColors}>
      <TopSection specialtyColors={specialtyColors}>
        <BadgeContainer>
          <VerifiedBadge>
            <FaCheckCircle /> Verified
          </VerifiedBadge>
          <ExperienceBadge>
            {data.experience || data.experience || 0}+ Years
          </ExperienceBadge>
        </BadgeContainer>
        
        <DoctorImage 
          src={data.profilePictureUrl} 
          alt={`${data.firstName || data.firstName} ${data.lastName || data.lastName}`}
          onError={handleImageError}
        />
        
        <NameSpecialtyContainer>
          <DoctorName>Dr. {`${data.firstName || data.firstName} ${data.lastName || data.lastName}`}</DoctorName>
          <SpecialtyTag specialtyColors={specialtyColors}>{data.specialty || data.specialty}</SpecialtyTag>
        </NameSpecialtyContainer>
      </TopSection>
      
      <InfoContainer>
        <div>
          <DoctorInfo specialtyColors={specialtyColors}>
            <FaCalendarAlt />
            <span>{data.experience || data.experience || 0} years of experience</span>
          </DoctorInfo>
          
          <LocationInfo>
            <FaMapMarkerAlt />
            <span>{formatLocation(data.location || data.location)}</span>
          </LocationInfo>
        </div>
        
        <RatingContainer>
          <DoctorInfo specialtyColors={specialtyColors}>
            <FaStar style={{ color: '#f6ad55' }} />
            <DoctorRating>{data.ratingScore || data.rating || data.doctorRating ? Number(data.ratingScore || data.rating || data.doctorRating).toFixed(1) : 'N/A'}</DoctorRating>
          </DoctorInfo>
          <NumberOfRaters>({data.ratingCount || data.ratingCount || 0} reviews)</NumberOfRaters>
        </RatingContainer>
      </InfoContainer>
      
      <ButtonContainer>
        <ContactButton onClick={toggleFavorite} className={isFavorite ? 'favorite' : ''} specialtyColors={specialtyColors}>
          {isFavorite ? <FaHeart /> : <FaRegHeart />}
        </ContactButton>
        
        <BookButton specialtyColors={specialtyColors}>
          <Link to={`/doctor-profile/${doctorId_final}`}>
            Book Appointment
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

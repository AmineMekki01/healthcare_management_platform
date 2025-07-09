import React, { useState } from 'react';
import { CardContainer, TopSection, DoctorImage, NameSpecialtyContainer, DoctorName, DoctorSpecialty, InfoContainer, DoctorInfo, DoctorRating, ButtonContainer, ActionLink, VerticalLine, RatingContainer, NumberOfRaters, BadgeContainer, VerifiedBadge, ExperienceBadge, SpecialtyTag, LocationInfo, ContactButton, BookButton } from './styles/DoctorCardStyles';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaMapMarkerAlt, FaStar, FaShare, FaUser, FaCheckCircle, FaPhone, FaEnvelope, FaHeart, FaRegHeart } from 'react-icons/fa';

const DoctorCard = ({
  doctorId,
  first_name,
  last_name,
  specialty,
  years_experience,
  doctor_rating,
  location,
  imageUrl,
  number_of_raters,
  doctor_user_name
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Dr. ${first_name} ${last_name}`,
        text: `Check out Dr. ${first_name} ${last_name}, ${specialty} specialist`,
        url: window.location.href
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Here you would typically save this to backend/localStorage
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getImageSrc = () => {
    if (imageError) {
      return `https://ui-avatars.com/api/?name=${first_name}+${last_name}&background=667eea&color=fff&size=120`;
    }
    return `http://localhost:3001/${imageUrl}`;
  };

  const formatLocation = (location) => {
    if (!location) return 'Location not specified';
    // Truncate long locations
    return location.length > 30 ? location.substring(0, 30) + '...' : location;
  };

  const getSpecialtyColor = (specialty) => {
    if (!specialty) return { primary: '#667eea', secondary: '#764ba2' };
    
    const specialtyLower = specialty.toLowerCase();
    
    const specialtyColors = {
      // Heart/Cardiology
      'cardiology': { primary: '#e53e3e', secondary: '#c53030' },
      'cardiologist': { primary: '#e53e3e', secondary: '#c53030' },
      
      // Brain/Neurology
      'neurology': { primary: '#805ad5', secondary: '#6b46c1' },
      'neurologist': { primary: '#805ad5', secondary: '#6b46c1' },
      'psychiatry': { primary: '#9f7aea', secondary: '#805ad5' },
      'psychiatrist': { primary: '#9f7aea', secondary: '#805ad5' },
      
      // Skin/Dermatology
      'dermatology': { primary: '#ed8936', secondary: '#dd6b20' },
      'dermatologist': { primary: '#ed8936', secondary: '#dd6b20' },
      
      // Children/Pediatrics
      'pediatrics': { primary: '#48bb78', secondary: '#38a169' },
      'pediatrician': { primary: '#48bb78', secondary: '#38a169' },
      
      // Bones/Orthopedics
      'orthopedics': { primary: '#a0522d', secondary: '#8b4513' },
      'orthopedist': { primary: '#a0522d', secondary: '#8b4513' },
      
      // Surgery
      'surgery': { primary: '#2b6cb0', secondary: '#2c5282' },
      'surgeon': { primary: '#2b6cb0', secondary: '#2c5282' },
      
      // Internal Medicine
      'internal medicine': { primary: '#319795', secondary: '#2c7a7b' },
      'internal': { primary: '#319795', secondary: '#2c7a7b' },
      
      // Gynecology
      'gynecology': { primary: '#d53f8c', secondary: '#b83280' },
      'gynecologist': { primary: '#d53f8c', secondary: '#b83280' },
      'obstetrics': { primary: '#ed64a6', secondary: '#d53f8c' },
      'obstetrician': { primary: '#ed64a6', secondary: '#d53f8c' },
      
      // Radiology
      'radiology': { primary: '#4a5568', secondary: '#2d3748' },
      'radiologist': { primary: '#4a5568', secondary: '#2d3748' },
      'radiologue': { primary: '#4a5568', secondary: '#2d3748' },
      
      // Dentistry
      'dentist': { primary: '#4299e1', secondary: '#3182ce' },
      'dental': { primary: '#4299e1', secondary: '#3182ce' },
      
      // Emergency
      'emergency': { primary: '#f56500', secondary: '#dd6b20' },
      'emergency medicine': { primary: '#f56500', secondary: '#dd6b20' },
      
      // Oncology
      'oncology': { primary: '#553c9a', secondary: '#44337a' },
      'oncologist': { primary: '#553c9a', secondary: '#44337a' },
      
      // Ophthalmology
      'ophthalmology': { primary: '#9f7aea', secondary: '#805ad5' },
      'ophthalmologist': { primary: '#9f7aea', secondary: '#805ad5' },
      
      // Anesthesiology
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

  const specialtyColors = getSpecialtyColor(specialty);

  return (
    <CardContainer specialtyColors={specialtyColors}>
      <TopSection specialtyColors={specialtyColors}>
        <BadgeContainer>
          <VerifiedBadge>
            <FaCheckCircle /> Verified
          </VerifiedBadge>
          <ExperienceBadge>
            {years_experience}+ Years
          </ExperienceBadge>
        </BadgeContainer>
        
        <DoctorImage 
          src={getImageSrc()} 
          alt={`${first_name} ${last_name}`}
          onError={handleImageError}
        />
        
        <NameSpecialtyContainer>
          <DoctorName>Dr. {`${first_name} ${last_name}`}</DoctorName>
          <SpecialtyTag specialtyColors={specialtyColors}>{specialty}</SpecialtyTag>
        </NameSpecialtyContainer>
      </TopSection>
      
      <InfoContainer>
        <div>
          <DoctorInfo specialtyColors={specialtyColors}>
            <FaCalendarAlt />
            <span>{years_experience} years of experience</span>
          </DoctorInfo>
          
          <LocationInfo>
            <FaMapMarkerAlt />
            <span>{formatLocation(location)}</span>
          </LocationInfo>
        </div>
        
        <RatingContainer>
          <DoctorInfo specialtyColors={specialtyColors}>
            <FaStar style={{ color: '#f6ad55' }} />
            <DoctorRating>{doctor_rating ? Number(doctor_rating).toFixed(1) : 'N/A'}</DoctorRating>
          </DoctorInfo>
          <NumberOfRaters>({number_of_raters || 0} reviews)</NumberOfRaters>
        </RatingContainer>
      </InfoContainer>
      
      <ButtonContainer>
        <ContactButton onClick={toggleFavorite} className={isFavorite ? 'favorite' : ''} specialtyColors={specialtyColors}>
          {isFavorite ? <FaHeart /> : <FaRegHeart />}
        </ContactButton>
        
        <BookButton specialtyColors={specialtyColors}>
          <Link to={`/DoctorProfile/${doctorId}`}>
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
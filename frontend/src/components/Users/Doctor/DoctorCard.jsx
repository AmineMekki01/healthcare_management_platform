import React from 'react';
import { CardContainer, TopSection, DoctorImage, NameSpecialtyContainer, DoctorName, DoctorSpecialty, InfoContainer, DoctorInfo, DoctorRating, ButtonContainer, ActionLink, VerticalLine, RatingContainer, NumberOfRaters
} from './styles/DoctorCardStyles';
import { Link } from 'react-router-dom';
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
  return (
    <CardContainer>
      <TopSection>
        <DoctorImage src={require("./../../../assets/images/profile_photo.jpeg")} alt={`${first_name} ${last_name}`} />
        <NameSpecialtyContainer>
          <DoctorName>{`${first_name} ${last_name}`}</DoctorName>
          <DoctorSpecialty>{specialty}</DoctorSpecialty>
        </NameSpecialtyContainer>
      </TopSection>
      <InfoContainer>
        <div>
          <DoctorInfo>{`Experience: ${years_experience} years`}</DoctorInfo>
          <DoctorInfo>{`Location: ${location}`}</DoctorInfo>
        </div>
        <RatingContainer>
          <DoctorInfo>
            Rating: <DoctorRating>{doctor_rating}</DoctorRating>
          </DoctorInfo>
          <NumberOfRaters>({number_of_raters} raters)</NumberOfRaters>
        </RatingContainer>
      </InfoContainer>
      <ButtonContainer>
          <ActionLink href="#" onClick={() => alert('Share Profile')}>Share</ActionLink>
          <VerticalLine />
          <Link to={`/DoctorProfile/${doctorId}`}>
            <ActionLink>Profile</ActionLink>
          </Link>
      </ButtonContainer>
    </CardContainer>
  );
};


export default DoctorCard;

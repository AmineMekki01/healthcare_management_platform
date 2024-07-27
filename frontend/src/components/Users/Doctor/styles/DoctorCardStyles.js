import styled from 'styled-components';


export const CardContainer = styled.div`
    width: 250px;
    height: 400px;
    // background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    border: 2px solid #6D6D6D;
    border-radius: 4px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 20px;
    margin: 5px;
`;

export const TopSection = styled.div`
    display: flex;
    align-items: center;
`;

export const DoctorImage = styled.img`
    width: 50%;
    height: 125px;
    object-fit: cover;
    border-radius: 10px;
    border: 4px solid #fff;
    margin-left: -10px;
`;

export const NameSpecialtyContainer = styled.div`
    width: 50%;
    margin-left: 10px;
`;

export const DoctorName = styled.h3`
    width: 100%; 
    margin: 0;
    font-size: 1.4em;
    color: #333;
`;

export const DoctorSpecialty = styled.p`
  margin: 4px 0;
  font-size: 1.1em;
  color: #666;
`;

export const InfoContainer = styled.div`
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
`;

export const DoctorInfo = styled.p`
    margin: 4px 0;
    font-size: 1em;
    color: #666;
`;

export const DoctorRating = styled.span`
    color: #f39c12;
    font-weight: bold;
`;

export const RatingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const NumberOfRaters = styled.span`
  margin-left: 8px;
  font-size: 0.9em;
  color: #666;
`;

export const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-around;
    margin-top: 10px;

`;


export const ActionLink = styled.a`
    border: none;
    height: 30px;
    color: #6D6D6D;
    font-size: 1em;
    cursor: pointer;
    transition: background-color 0.3s ease;
    text-decoration: none;
    text-align: center;

    &:hover {
        border-bottom: 2px solid #6D6D6D;
    }
`;

export const VerticalLine = styled.div`
    height: 100%;
    width: 2px;
    background-color: #6D6D6D;
    margin: 0 10px;
`;
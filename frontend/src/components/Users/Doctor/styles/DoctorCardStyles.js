import styled from 'styled-components';


export const CardContainer = styled.div`
    width: 300px;
    height: 450px;
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
    }
`;

export const TopSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #6DC8B7;
    padding: 20px;
`;

export const DoctorImage = styled.img`
    width: 125px;
    height: 125px;
    object-fit: cover;
    border-radius: 50%;
    border: 4px solid #fff;
    margin-bottom: 15px;
`;

export const NameSpecialtyContainer = styled.div`
    text-align: center;
`;

export const DoctorName = styled.h3`
    margin: 0;
    font-size: 1.2em;
    color: #fff;
`;

export const DoctorSpecialty = styled.p`
    margin: 5px 0 0;
    font-size: 0.9em;
    color: #e0e0e0;
`;

export const InfoContainer = styled.div`
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

export const DoctorInfo = styled.p`
    margin: 5px 0;
    font-size: 0.9em;
    color: #333;
`;

export const DoctorRating = styled.span`
    color: #f39c12;
    font-weight: bold;
    font-size: 1.1em;
`;

export const RatingContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 5px;
`;

export const NumberOfRaters = styled.span`
    margin-left: 8px;
    font-size: 0.9em;
    color: #666;
`;

export const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-around;
    padding: 15px;
    background-color: #f5f7fa;
`;

export const ActionLink = styled.a`
    border: none;
    color: #6DC8B7;
    font-size: 0.9em;
    font-weight: bold;
    cursor: pointer;
    transition: color 0.3s ease;
    text-decoration: none;
    text-align: center;

    &:hover {
        color: #5ab3a1;
    }
`;


export const VerticalLine = styled.div`
    height: 20px;
    width: 1px;
    background-color: #e0e0e0;
    margin: 0 5px;
`;
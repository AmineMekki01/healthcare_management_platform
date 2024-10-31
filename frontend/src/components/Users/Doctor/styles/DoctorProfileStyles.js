// StyledComponents.js
import styled from 'styled-components';

import { Link } from 'react-router-dom';

export const MainContainer = styled.div`
  background-color: #f0f2f5;
  min-height: 100vh;
`;

export const Header = styled.header`
  background-color: #ffffff;
  padding: 30px 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  @media (max-width: 450px) {
    flex-direction: column;
    align-items: center;
  }
`;

export const DoctorInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: 30px;
  @media (max-width: 450px) {
    margin-left: 0;
  }
`;

export const ProfileImage = styled.img`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #6DC8B7;
  margin-right: 30px;
  @media (max-width: 450px) {
    margin-bottom: 20px;
      margin-left: 0;

  }
`;

export const DoctorName = styled.h1`
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
`;

export const DoctorInfo = styled.p`
  font-size: 16px;
  color: #666;
  margin-bottom: 5px;
`;

export const FollowButton = styled.button`
  background-color: #6DC8B7;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 15px;

  &:hover {
    background-color: #5ab3a1;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

export const BodyContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const LeftColumn = styled.div`
  flex: 2;
  margin-right: 20px;

  @media (max-width: 768px) {
    margin-right: 0;
    margin-bottom: 20px;
  }
`;


export const RightColumn = styled.div`
  flex: 1;
`;

export const Section = styled.section`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 20px;
`;

export const Title = styled.h2`
  font-size: 24px;
  color: #333;
  margin-bottom: 15px;
  border-bottom: 2px solid #6DC8B7;
  padding-bottom: 10px;
`;

export const Subtitle = styled.h3`
  font-size: 18px;
  color: #666;
  margin-top: 15px;
  margin-bottom: 10px;
`;

export const Text = styled.p`
  font-size: 16px;
  color: #444;
  line-height: 1.6;
`;


export const List = styled.ul`
  list-style: none;
  padding: 0;
`;

export const ListItem = styled.li`
  font-size: 16px;
  color: #444;
  padding: 5px 0;
  display: flex;
  align-items: center;

  &:before {
    content: '•';
    color: #6DC8B7;
    font-weight: bold;
    display: inline-block;
    width: 1em;
    margin-left: -1em;
  }
`;

export const Image = styled.img`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  border: 4px solid #ffffff;
`;

export const StatBox = styled.div`
  text-align: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin: 10px;
  flex: 1;
  min-width: 120px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

export const StatNumber = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #6DC8B7;
`;

export const Button = styled.button`
  background-color: #6DC8B7;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #5ab3a1;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

export const LocationContainer = styled(Section)`
  position: relative;
`;

export const MapContainer = styled.div`
  height: 300px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 15px;
`;

export const SocialIcon = styled.a`
  color: #6DC8B7;
  font-size: 24px;
  margin: 0 10px;
  transition: color 0.3s ease;

  &:hover {
    color: #5ab3a1;
  }
`;

export const Info = styled.div`
  display: flex;
  background-color: white;
  border-radius: 8px;
  padding: 20px;

  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  flex-direction: column;
  align-items: center;
  margin-top: 20px;
`;

export const LocationInfo = styled.div`
  font-size: 16px;
  color: #666;
  margin-bottom: 10px;
`;

export const LocationLink = styled.a`
  color: #0066cc;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export const MapImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 4px;
  margin-top: 10px;
`;

export const Statistic = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
  flex-wrap: wrap;
`;

export const Badge = styled.span`
  color: white;
  background-color: #0056b3;
  border-radius: 10px;
  padding: 5px 10px;
  font-size: 14px;
  margin-right: 10px;
`;

export const BreakingLine = styled.hr`
  border: 0;
  border-top: 2px solid #ccc;
  width: 100%;
  margin: 20px 0;
`;


export const HistoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eaeaea;
`;

export const DiagnosisName = styled.span`
  font-size: 16px;
  color: #444;
  flex: 1;
`;

export const DiagnosisDate = styled.span`
  font-size: 14px;
  color: #888;
  flex-shrink: 0;
  margin-left: 20px;
`;

export const DiagnosisLink = styled(Link)`
  text-decoration: none;
  color: inherit;

  &:hover {
    text-decoration: underline;
    color: #6DC8B7; /* Optional hover color */
  }
`;

export const SectionContainer = styled.div`
  margin-bottom: 20px;
`;

export const SectionTitle = styled.h2`
  font-size: 24px;
  color: #333;
  margin-bottom: 15px;
  border-bottom: 2px solid #6DC8B7;
  padding-bottom: 10px;
`;

export const Card = styled.div`
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 15px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

export const CardTitle = styled.h3`
  font-size: 20px;
  color: #444;
  margin-bottom: 10px;
`;

export const CardContent = styled.div`
  font-size: 16px;
  color: #666;
  line-height: 1.6;

  p {
    margin: 5px 0;
  }

  strong {
    color: #333;
  }
`;
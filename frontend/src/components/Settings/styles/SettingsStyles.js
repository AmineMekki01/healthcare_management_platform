/* SettingsStyles.js */
import styled from 'styled-components';

export const SettingsContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

export const SectionTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 20px;
`;

export const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  button {
    margin-bottom: 10px;
    padding: 10px;
    background-color: #6DC8B7;
    border: none;
    color: white;
    cursor: pointer;
    &:hover {
      background-color: #5ab3a1;
    }
  }
`;

export const Card = styled.div`
  background: #f5f5f5;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
`;

export const DoctorName = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #333;
`;

export const UnfollowButton = styled.button`
  background-color: #ff6b6b;
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #ff4b4b;
  }
`;

export const NoDoctorsMessage = styled.p`
  text-align: center;
  font-size: 16px;
  color: #888;
  margin-top: 20px;
`;

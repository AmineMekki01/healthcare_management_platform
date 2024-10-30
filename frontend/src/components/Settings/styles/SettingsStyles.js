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


export const FormSection = styled.div`
  margin-bottom: 40px;
`;

export const AddButton = styled.button`
  padding: 10px 20px;
  background-color: #6dc8b7;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease;
  margin-bottom: 20px;

  &:hover {
    background-color: #5ab3a1;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

export const ItemList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Item = styled.div`
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

export const RemoveButton = styled.button`
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #ff6b6b;
  border: none;
  color: white;
  font-size: 14px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #ff4b4b;
  }
`;

export const InputField = styled.input`
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  box-sizing: border-box;
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  resize: vertical;
  box-sizing: border-box;
`;

export const DateField = styled.input`
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  box-sizing: border-box;
`;

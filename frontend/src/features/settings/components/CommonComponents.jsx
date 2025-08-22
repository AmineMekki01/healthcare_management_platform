import React from 'react';
import styled from 'styled-components';

export const LoadingSpinner = styled.div`
  width: ${props => props.size || '40px'};
  height: ${props => props.size || '40px'};
  border: 3px solid #f3f3f3;
  border-top: 3px solid #6DC8B7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${props => props.columns || '1fr 1fr'};
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Label = styled.label`
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  margin-bottom: 4px;
`;

export const Input = styled.input`
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  
  &:focus {
    outline: none;
    border-color: #6DC8B7;
    box-shadow: 0 0 0 3px rgba(109, 200, 183, 0.1);
    background: white;
  }
  
  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
`;

export const TextArea = styled.textarea`
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  
  &:focus {
    outline: none;
    border-color: #6DC8B7;
    box-shadow: 0 0 0 3px rgba(109, 200, 183, 0.1);
    background: white;
  }
  
  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
`;

export const Button = styled.button`
  padding: 14px 28px;
  background: ${props => 
    props.variant === 'secondary' 
      ? '#6c757d' 
      : props.variant === 'danger' 
        ? 'linear-gradient(45deg, #ff6b6b, #ff5252)'
        : 'linear-gradient(45deg, #6DC8B7, #4CAF50)'
  };
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  min-width: 120px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(109, 200, 183, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export const FileUploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const FileUploadArea = styled.div`
  border: 2px dashed #6DC8B7;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(109, 200, 183, 0.05);
  
  &:hover {
    background: rgba(109, 200, 183, 0.1);
    border-color: #4CAF50;
  }
  
  input[type="file"] {
    display: none;
  }
`;

export const FileUploadText = styled.div`
  color: #6DC8B7;
  font-weight: 600;
  margin-bottom: 8px;
`;

export const FileUploadSubtext = styled.div`
  color: #7f8c8d;
  font-size: 14px;
`;

export const AvatarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
`;

export const Avatar = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

export const AvatarPlaceholder = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(45deg, #6DC8B7, #4CAF50);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 48px;
  font-weight: 600;
  border: 4px solid white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

export const StatusMessage = styled.div`
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  font-weight: 500;
  
  ${props => props.type === 'error' && `
    background: linear-gradient(45deg, #ff6b6b, #ff5252);
    color: white;
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  `}
  
  ${props => props.type === 'success' && `
    background: linear-gradient(45deg, #4CAF50, #45a049);
    color: white;
    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
  `}
  
  ${props => props.type === 'info' && `
    background: linear-gradient(45deg, #2196F3, #1976D2);
    color: white;
    box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
  `}
`;

export const UploadIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
  </svg>
);

export const SaveIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
    <path d="M17,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3M19,19H5V5H16.17L19,7.83V19M12,12A3,3 0 0,0 9,15A3,3 0 0,0 12,18A3,3 0 0,0 15,15A3,3 0 0,0 12,12Z"/>
  </svg>
);

export const LoadingIcon = () => (
  <LoadingSpinner size="20px" />
);

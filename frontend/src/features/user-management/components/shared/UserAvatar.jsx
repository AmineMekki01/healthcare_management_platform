import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const AvatarContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const AvatarImage = styled.img`
  width: ${props => props.$size || '64px'};
  height: ${props => props.$size || '64px'};
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid ${props => props.$borderColor || '#e2e8f0'};
  transition: all 0.3s ease;
  cursor: ${props => props.$editable ? 'pointer' : 'default'};
  
  &:hover {
    transform: ${props => props.$editable ? 'scale(1.05)' : 'none'};
    border-color: ${props => props.$editable ? '#667eea' : props.$borderColor || '#e2e8f0'};
  }
`;

const AvatarPlaceholder = styled.div`
  width: ${props => props.$size || '64px'};
  height: ${props => props.$size || '64px'};
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: ${props => {
    const size = parseInt(props.$size || '64');
    return `${Math.max(size / 3, 16)}px`;
  }};
  border: 3px solid ${props => props.$borderColor || '#e2e8f0'};
  cursor: ${props => props.$editable ? 'pointer' : 'default'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: ${props => props.$editable ? 'scale(1.05)' : 'none'};
    border-color: ${props => props.$editable ? '#667eea' : props.$borderColor || '#e2e8f0'};
  }
`;

const EditOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
  color: white;
  font-size: 14px;
  font-weight: 500;
  
  ${AvatarContainer}:hover & {
    opacity: ${props => props.$editable ? 1 : 0};
  }
`;

const StatusBadge = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: ${props => {
    const size = parseInt(props.$avatarSize || '64');
    return `${Math.max(size / 4, 12)}px`;
  }};
  height: ${props => {
    const size = parseInt(props.$avatarSize || '64');
    return `${Math.max(size / 4, 12)}px`;
  }};
  border-radius: 50%;
  background: ${props => props.$online ? '#10b981' : '#ef4444'};
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const HiddenInput = styled.input`
  display: none;
`;

const UserAvatar = ({ 
  user, 
  size = '64px',
  editable = false,
  borderColor,
  onImageUpload,
  className 
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const { i18n } = useTranslation();
  const isArabic = (i18n?.language || '').toLowerCase().startsWith('ar');

  const getInitials = (user) => {
    if (!user) return '?';

    const firstName = isArabic ? (user.firstNameAr || user.firstName || '') : (user.firstName || '');
    const lastName = isArabic ? (user.lastNameAr || user.lastName || '') : (user.lastName || '');
    const email = user.email || '';

    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    
    return '?';
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !onImageUpload) return;

    setIsUploading(true);
    try {
      await onImageUpload(file);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (editable && !isUploading) {
      document.getElementById(`avatar-upload-${user?.id || 'default'}`).click();
    }
  };
  const isOnline = user?.isOnline || false;
  const userName = isArabic ? (user?.firstNameAr || user?.firstName || 'User') : (user?.firstName || 'User');

  return (
    <AvatarContainer className={className} onClick={handleClick}>
      {user?.profilePictureUrl ? (
        <AvatarImage 
          src={user?.profilePictureUrl}
          alt={`${userName}'s avatar`}
          $size={size}
          $borderColor={borderColor}
          $editable={editable}
        />
      ) : (
        <AvatarPlaceholder 
          $size={size}
          $borderColor={borderColor}
          $editable={editable}
        >
          {getInitials(user)}
        </AvatarPlaceholder>
      )}
      
      {editable && (
        <EditOverlay $editable={editable}>
          {isUploading ? 'Uploading...' : 'Edit'}
        </EditOverlay>
      )}
      
      {editable && (
        <HiddenInput
          id={`avatar-upload-${user?.id || 'default'}`}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={isUploading}
        />
      )}
    </AvatarContainer>
  );
};

export default UserAvatar;

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import UserAvatar from './shared/UserAvatar';
import { useUserManagement } from '../hooks/useUserManagement';

const ProfileContainer = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const ProfileHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 32px;
  color: white;
  position: relative;
  display: flex;
  gap: 32px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    pointer-events: none;
  }
`;

const AvatarSection = styled.div`
  position: relative;
  z-index: 1;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
  min-width: 280px;
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  text-align: left;
  gap: 4px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const UserName = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const UserRole = styled.p`
  margin: 4px 0 0 0;
  font-size: 16px;
  opacity: 0.9;
  text-transform: capitalize;
`;

const UserEmail = styled.p`
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
`;

const ProfileBody = styled.div`
  padding: 32px;
`;

const Section = styled.div`
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FieldLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FieldValue = styled.div`
  font-size: 16px;
  color: #1a202c;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
`;

const FieldInput = styled.input`
  font-size: 16px;
  color: #1a202c;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const FieldTextarea = styled.textarea`
  font-size: 16px;
  color: #1a202c;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: border-color 0.2s ease;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const EditActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
`;

const Button = styled.button`
  padding: ${props => props.$small ? '8px 14px' : '12px 24px'};
  border-radius: ${props => props.$small ? '6px' : '8px'};
  font-size: ${props => props.$small ? '13px' : '14px'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  
  ${props => props.$variant === 'primary' && `
    background: #667eea;
    border-color: #667eea;
    color: white;
    
    &:hover {
      background: #5a67d8;
      border-color: #5a67d8;
    }
    
    &:disabled {
      background: #a0aec0;
      border-color: #a0aec0;
      cursor: not-allowed;
    }
  `}
  
  ${props => props.$variant === 'secondary' && `
    background: transparent;
    border-color: #e2e8f0;
    color: #64748b;
    
    &:hover {
      background: #f8fafc;
      border-color: #cbd5e0;
    }
  `}
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: #64748b;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 16px;
  border-radius: 8px;
  margin: 16px;
`;

const UserProfile = ({ 
  userId, 
  userType, 
  user: propUser,
  editable = false,
  customFields = [],
  onSave,
  className,
  headerActions = []
}) => {
  const { t } = useTranslation('userManagement');
  const { 
    user: hookUser, 
    loading, 
    error, 
    updateUser, 
    uploadUserImage 
  } = useUserManagement(propUser ? null : userId, propUser ? null : userType);
  
  const user = propUser || hookUser;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (user) {
      setEditData(user);
      console.log('User data loaded:', user);
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(user);
  };

  const handleSave = async () => {
    try {
      const updatedUser = await updateUser(userId, userType, editData);
      setIsEditing(false);
      if (onSave) {
        onSave(updatedUser);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (file) => {
    try {
      await uploadUserImage(userId, userType, file);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const getFullName = (user) => {
    return `${user?.firstName} ${user?.lastName}`.trim() || t('userProfile.messages.unknownUser');
  };

  const getUserRole = (user) => {
    if (user?.specialty) return t('common.roles.doctor');
    if (user?.patientId) return t('common.roles.patient');
    if (user?.receptionistId) return t('common.roles.receptionist');
    return user?.role || user?.userType || user?.type || t('common.roles.user');
  };

  const getUserEmail = (user) => {
    return user?.email;
  };

  const defaultFields = [
    { key: 'firstName', label: t('userProfile.fields.firstName'), type: 'text' },
    { key: 'lastName', label: t('userProfile.fields.lastName'), type: 'text' },
    { key: 'email', label: t('userProfile.fields.email'), type: 'email' },
    { key: 'phoneNumber', label: t('userProfile.fields.phoneNumber'), type: 'tel' },
    { key: 'birthDate', label: t('userProfile.fields.dateOfBirth'), type: 'date' },
    { key: 'streetAddress', label: t('userProfile.fields.address'), type: 'textarea' },
  ];

  const profileFields = customFields.length > 0 ? customFields : defaultFields;

  if (!propUser && loading) {
    return (
      <ProfileContainer className={className}>
        <LoadingSpinner>{t('userProfile.messages.loading')}</LoadingSpinner>
      </ProfileContainer>
    );
  }

  if (!propUser && error) {
    return (
      <ProfileContainer className={className}>
        <ErrorMessage>{t('userProfile.messages.updateFailed')}: {error}</ErrorMessage>
      </ProfileContainer>
    );
  }

  if (!user) {
    return (
      <ProfileContainer className={className}>
        <ErrorMessage>{t('userProfile.messages.userNotFound')}</ErrorMessage>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer className={className}>
      <ProfileHeader>
        <HeaderLeft>
          <AvatarSection>
            <UserAvatar 
              user={user}
              size="120px"
              editable={editable && !isEditing}
              onImageUpload={handleImageUpload}
            />
          </AvatarSection>
          <HeaderText>
            <UserName>{getFullName(user)}</UserName>
            <UserRole>{getUserRole(user)}</UserRole>
            <UserEmail>{getUserEmail(user)}</UserEmail>
          </HeaderText>
        </HeaderLeft>
        {headerActions.length > 0 && (
          <HeaderActions>
            {headerActions.map((action, idx) => (
              <Button
                key={idx}
                $variant={action.variant || 'primary'}
                $small={action.small}
                onClick={action.onClick}
                disabled={action.disabled}
                title={action.title || action.label}
              >
                {action.label}
              </Button>
            ))}
          </HeaderActions>
        )}
      </ProfileHeader>

      <ProfileBody>
        <Section>
          <SectionTitle>{t('userProfile.sections.personalInfo')}</SectionTitle>
          <FieldGrid>
            {profileFields.map((field) => (
              <Field key={field.key}>
                <FieldLabel>{field.label}</FieldLabel>
                {isEditing ? (
                  field.type === 'textarea' ? (
                    <FieldTextarea
                      value={editData[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <FieldInput
                      type={field.type || 'text'}
                      value={editData[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  )
                ) : (
                  <FieldValue>
                    {user[field.key] || t('common.notAvailable')}
                  </FieldValue>
                )}
              </Field>
            ))}
          </FieldGrid>
        </Section>

        {editable && (
          <EditActions>
            {isEditing ? (
              <>
                <Button 
                  $variant="primary" 
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? t('userProfile.messages.saving') : t('userProfile.buttons.save')}
                </Button>
                <Button $variant="secondary" onClick={handleCancel}>
                  {t('userProfile.buttons.cancel')}
                </Button>
              </>
            ) : (
              <Button $variant="primary" onClick={handleEdit}>
                {t('userProfile.buttons.edit')}
              </Button>
            )}
          </EditActions>
        )}
      </ProfileBody>
    </ProfileContainer>
  );
};

export default UserProfile;

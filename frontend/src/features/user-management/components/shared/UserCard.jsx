import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import UserAvatar from './UserAvatar';

const Card = styled.div`
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(148, 163, 184, 0.35);
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  
  &:hover {
    transform: ${props => props.$clickable ? 'translateY(-2px)' : 'none'};
    box-shadow: ${props => props.$clickable ? '0 18px 44px rgba(15, 23, 42, 0.12)' : '0 12px 30px rgba(15, 23, 42, 0.08)'};
    border-color: rgba(99, 102, 241, 0.35);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-direction: ${props => props.$rtl ? 'row-reverse' : 'row'};
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h3`
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: -0.2px;
`;

const UserRole = styled.p`
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #4f46e5;
  font-weight: 600;
  text-transform: capitalize;
`;

const UserEmail = styled.p`
  margin: 0;
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch (props.$status) {
      case 'active': return '#d1fae5';
      case 'inactive': return '#fee2e2';
      case 'pending': return '#fef3c7';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'active': return '#059669';
      case 'inactive': return '#dc2626';
      case 'pending': return '#d97706';
      default: return '#475569';
    }
  }};
`;

const StatusDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
`;

const Body = styled.div`
  margin-top: 16px;
`;

const MetaData = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 12px;
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MetaLabel = styled.span`
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetaValue = styled.span`
  font-size: 14px;
  color: #1a202c;
  font-weight: 500;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  justify-content: flex-start;
  flex-direction: ${props => props.$rtl ? 'row-reverse' : 'row'};
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.$variant === 'primary' && `
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    border-color: rgba(79, 70, 229, 0.9);
    color: white;
    
    &:hover {
      filter: brightness(0.98);
    }
  `}
  
  ${props => props.$variant === 'secondary' && `
    background: rgba(255, 255, 255, 0.75);
    border-color: rgba(148, 163, 184, 0.45);
    color: #334155;
    
    &:hover {
      background: rgba(248, 250, 252, 1);
      border-color: rgba(100, 116, 139, 0.35);
    }
  `}
  
  ${props => props.$variant === 'danger' && `
    background: transparent;
    border-color: rgba(239, 68, 68, 0.35);
    color: #b91c1c;
    
    &:hover {
      background: rgba(254, 242, 242, 1);
      border-color: rgba(248, 113, 113, 0.6);
    }
  `}
`;

const UserCard = ({ 
  user,
  userType,
  onClick,
  showMetaData = true,
  actions = [],
  metaFields = [],
  className 
}) => {
  const { t, i18n } = useTranslation(['common', 'staff']);
  const lang = String(i18n?.language || '').toLowerCase();
  const isArabic = lang.startsWith('ar');

  const getFullName = (user) => {
    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';
    const firstNameAr = user?.firstNameAr || '';
    const lastNameAr = user?.lastNameAr || '';

    const displayFirstName = isArabic ? (firstNameAr || firstName) : firstName;
    const displayLastName = isArabic ? (lastNameAr || lastName) : lastName;
    const fullName = `${displayFirstName} ${displayLastName}`.trim();

    if (fullName) return fullName;
    if (user?.fullName) return user.fullName;
    if (user?.name) return user.name;

    return t('staff:utils.unknownUser', { defaultValue: 'Unknown User' });
  };

  const getUserStatus = (user) => {
    if (user?.isActive === false) return 'inactive';
    if (user?.isPending) return 'pending';
    return 'active';
  };

  const getStatusLabel = (status) => {
    return t(`staff:status.${status}`, {
      defaultValue: t(`common:status.${status}`, { defaultValue: status || '' })
    });
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(user);
    }
  };

  const notAvailable = t('common:common.notAvailable', { defaultValue: 'N/A' });

  const defaultMetaFields = [
    {
      label: t('staff:labels.phone', { defaultValue: 'Phone' }),
      value: user?.phoneNumber || notAvailable
    },
    {
      label: t('staff:labels.joined', { defaultValue: 'Joined' }),
      value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString(i18n?.language || undefined) : notAvailable
    },
  ];

  const displayMetaFields = metaFields.length > 0 ? metaFields : defaultMetaFields;

  return (
    <Card 
      $clickable={!!onClick}
      onClick={handleCardClick}
      className={className}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <Header $rtl={isArabic}>
        <UserAvatar 
          user={user}
          size="56px"
        />
        <UserInfo>
          <UserName>{getFullName(user)}</UserName>
          {userType ? <UserRole>{userType}</UserRole> : null}
          <UserEmail>{user?.email || notAvailable}</UserEmail>
        </UserInfo>
      </Header>

      {showMetaData && (
        <Body>
          <MetaData>
            {displayMetaFields.map((field, index) => (
              <MetaItem key={index}>
                <MetaLabel>{field.label}</MetaLabel>
                <MetaValue>{field.value}</MetaValue>
              </MetaItem>
            ))}
          </MetaData>
        </Body>
      )}

      {actions.length > 0 && (
        <Actions $rtl={isArabic}>
          {actions.map((action, index) => (
            <ActionButton
              key={index}
              $variant={action.variant || 'secondary'}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(user);
              }}
              disabled={action.disabled}
            >
              {action.label}
            </ActionButton>
          ))}
        </Actions>
      )}
    </Card>
  );
};

export default UserCard;

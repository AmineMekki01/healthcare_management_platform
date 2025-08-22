import React from 'react';
import styled from 'styled-components';
import UserAvatar from './UserAvatar';

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  
  &:hover {
    transform: ${props => props.$clickable ? 'translateY(-2px)' : 'none'};
    box-shadow: ${props => props.$clickable ? '0 8px 24px rgba(0, 0, 0, 0.15)' : '0 4px 16px rgba(0, 0, 0, 0.1)'};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h3`
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
`;

const UserRole = styled.p`
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #667eea;
  font-weight: 500;
  text-transform: capitalize;
`;

const UserEmail = styled.p`
  margin: 0;
  font-size: 14px;
  color: #64748b;
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
    background: #667eea;
    border-color: #667eea;
    color: white;
    
    &:hover {
      background: #5a67d8;
      border-color: #5a67d8;
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
  
  ${props => props.$variant === 'danger' && `
    background: transparent;
    border-color: #fecaca;
    color: #dc2626;
    
    &:hover {
      background: #fef2f2;
      border-color: #f87171;
    }
  `}
`;

const UserCard = ({ 
  user,
  userType,
  onClick,
  showStatus = true,
  showMetaData = true,
  actions = [],
  metaFields = [],
  className 
}) => {
  const getFullName = (user) => {
    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown User';
  };

  const getUserStatus = (user) => {
    if (user?.isActive === false) return 'inactive';
    if (user?.isPending) return 'pending';
    return 'active';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(user);
    }
  };

  const defaultMetaFields = [
    { label: 'Phone', value: user?.phoneNumber || 'N/A' },
    { label: 'Joined', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A' },
  ];

  const displayMetaFields = metaFields.length > 0 ? metaFields : defaultMetaFields;

  return (
    <Card 
      $clickable={!!onClick}
      onClick={handleCardClick}
      className={className}
    >
      <Header>
        <UserAvatar 
          user={user}
          size="56px"
          showStatus={false}
        />
        <UserInfo>
          <UserName>{getFullName(user)}</UserName>
          <UserRole>{userType}</UserRole>
          <UserEmail>{user?.email || 'No email'}</UserEmail>
        </UserInfo>
        {showStatus && (
          <StatusBadge $status={getUserStatus(user)}>
            <StatusDot />
            {getStatusLabel(getUserStatus(user))}
          </StatusBadge>
        )}
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
        <Actions>
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

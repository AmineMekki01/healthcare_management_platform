import React from 'react';
import styled from 'styled-components';
import UserCard from '../../user-management/components/shared/UserCard';

const StaffCardContainer = styled.div`
  position: relative;
`;

const RoleBadge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 2;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
`;

const StatusIndicator = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  z-index: 2;
  
  ${props => {
    switch (props.$status) {
      case 'online':
      case 'available':
      case 'active':
        return 'background: #10b981;';
      case 'busy':
        return 'background: #f59e0b;';
      case 'offline':
      case 'unavailable':
      case 'inactive':
        return 'background: #ef4444;';
      case 'break':
        return 'background: #8b5cf6;';
      default:
        return 'background: #64748b;';
    }
  }}
`;

const SpecializationTag = styled.span`
  display: inline-block;
  padding: 2px 6px;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  margin-right: 4px;
  margin-bottom: 2px;
`;

const ScheduleInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
`;

const ScheduleIcon = styled.span`
  font-size: 12px;
`;

const PermissionsSection = styled.div`
  margin-top: 8px;
`;

const PermissionLabel = styled.div`
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const PermissionTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const StaffCard = ({ 
  staff, 
  onClick, 
  onEdit, 
  onViewSchedule, 
  onManagePermissions,
  onActivate,
  onDeactivate,
  onDismiss,
  showRole = true,
  showStatus = true,
  showPermissions = true,
  showSchedule = true,
  actions = [],
  className 
}) => {
  const getDefaultActions = () => {
    const defaultActions = [];
    
    if (onEdit) {
      defaultActions.push({
        label: 'Edit',
        variant: 'primary',
        onClick: onEdit
      });
    }
    
    if (onViewSchedule) {
      defaultActions.push({
        label: 'Schedule',
        variant: 'secondary',
        onClick: onViewSchedule
      });
    }
    
    if (onManagePermissions) {
      defaultActions.push({
        label: 'Permissions',
        variant: 'secondary',
        onClick: onManagePermissions
      });
    }
    
    if (staff?.isActive && onDeactivate) {
      defaultActions.push({
        label: 'Deactivate',
        variant: 'danger',
        onClick: onDeactivate
      });
    } else if (!staff?.isActive && onActivate) {
      defaultActions.push({
        label: 'Activate',
        variant: 'primary',
        onClick: onActivate
      });
    }
    
    if (onDismiss) {
      defaultActions.push({
        label: 'Dismiss',
        variant: 'danger',
        onClick: onDismiss
      });
    }
    
    return defaultActions;
  };

  const getMetaFields = () => {
    const fields = [
      { 
        label: 'Phone', 
        value: staff?.phoneNumber || staff?.phone_number || 'N/A' 
      },
      { 
        label: 'Joined', 
        value: staff?.createdAt ? new Date(staff.createdAt).toLocaleDateString() : 'N/A' 
      }
    ];

    if (staff?.assignedDoctorId) {
      fields.push({
        label: 'Assigned',
        value: 'Yes'
      });
    }

    if (staff?.emailVerified !== undefined) {
      fields.push({
        label: 'Verified',
        value: staff.emailVerified ? 'Yes' : 'No'
      });
    }

    return fields;
  };

  const renderPermissions = () => {
    if (!showPermissions) return null;

    const permissions = staff?.permissions || [];
    
    if (permissions.length === 0) {
      return (
        <PermissionsSection>
          <PermissionLabel>Permissions</PermissionLabel>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            No specific permissions set
          </div>
        </PermissionsSection>
      );
    }

    return (
      <PermissionsSection>
        <PermissionLabel>Permissions</PermissionLabel>
        <PermissionTags>
          {permissions.map((permission, index) => (
            <SpecializationTag key={index}>
              {permission}
            </SpecializationTag>
          ))}
        </PermissionTags>
      </PermissionsSection>
    );
  };

  const renderScheduleInfo = () => {
    if (!showSchedule) return null;

    const schedule = staff?.workSchedule || staff?.schedule;
    
    if (!schedule) {
      return (
        <ScheduleInfo>
          <ScheduleIcon>📅</ScheduleIcon>
          <span>Schedule not set</span>
        </ScheduleInfo>
      );
    }

    if (Array.isArray(schedule)) {
      const workDays = schedule.length;
      return (
        <ScheduleInfo>
          <ScheduleIcon>📅</ScheduleIcon>
          <span>{workDays} days/week</span>
        </ScheduleInfo>
      );
    }

    if (typeof schedule === 'string') {
      return (
        <ScheduleInfo>
          <ScheduleIcon>📅</ScheduleIcon>
          <span>{schedule}</span>
        </ScheduleInfo>
      );
    }

    return (
      <ScheduleInfo>
        <ScheduleIcon>📅</ScheduleIcon>
        <span>Full-time</span>
      </ScheduleInfo>
    );
  };

  const customContent = (
    <>
      {renderPermissions()}
      {renderScheduleInfo()}
    </>
  );

  return (
    <StaffCardContainer className={className}>
      {showRole && (
        <RoleBadge>
          Receptionist
        </RoleBadge>
      )}
      
      {showStatus && (
        <StatusIndicator $status={staff?.status || 'inactive'} />
      )}
      
      <UserCard
        user={staff}
        onClick={onClick}
        actions={actions.length > 0 ? actions : getDefaultActions()}
        metaFields={getMetaFields()}
        customContent={customContent}
        showStatus={false}
      />
    </StaffCardContainer>
  );
};

export default StaffCard;

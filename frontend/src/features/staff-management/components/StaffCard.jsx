import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import UserCard from '../../user-management/components/shared/UserCard';

const StaffCardContainer = styled.div`
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: scale(1.02);
  }
`;

const StatusIndicator = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: ${props => {
    switch(props.$status) {
      case 'active': return '#10b981';
      case 'inactive': return '#ef4444';
      default: return '#94a3b8';
    }
  }};
  z-index: 2;
  
  ${props => props.$status === 'active' && `
    animation: pulse 2s ease-in-out infinite;
  `}
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }
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

const StaffCard = ({ 
  staff, 
  onClick, 
  onEdit, 
  onViewSchedule, 
  onDismiss,
  showRole = true,
  actions = [],
  className 
}) => {
  const { t, i18n } = useTranslation('staff');
  const getDefaultActions = () => {
    const defaultActions = [];
    
    if (onEdit) {
      defaultActions.push({
        label: t('actions.edit'),
        variant: 'primary',
        onClick: onEdit
      });
    }
    
    if (onViewSchedule) {
      defaultActions.push({
        label: t('actions.viewSchedule'),
        variant: 'secondary',
        onClick: onViewSchedule
      });
    }
    
    if (onDismiss) {
      defaultActions.push({
        label: t('actions.dismiss'),
        variant: 'danger',
        onClick: onDismiss
      });
    }
    
    return defaultActions;
  };

  const getMetaFields = () => {
    const experienceYears = typeof staff?.experienceYears === 'number'
      ? staff.experienceYears
      : (typeof staff?.experience === 'number' ? staff.experience : 0);

    const notAvailable = t('utils.notAvailable', { defaultValue: 'N/A' });

    const formattedExperienceYears = new Intl.NumberFormat(i18n?.language || undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(experienceYears);
    const experienceDir = String(i18n?.language || '').toLowerCase().startsWith('ar') ? 'rtl' : 'ltr';

    const yearsLabel = t('utils.years', { defaultValue: 'years' });
    const experienceText = t('utils.yearsWithValue', {
      value: formattedExperienceYears,
      defaultValue: `${formattedExperienceYears} ${yearsLabel}`,
    });

    const experienceValue = experienceDir === 'rtl'
      ? (
        <span dir="ltr">
          <bdi dir="ltr">{formattedExperienceYears}</bdi>{' '}
          <bdi dir="rtl">{t('utils.years', { defaultValue: 'years' })}</bdi>
        </span>
      )
      : (<span dir="ltr">{experienceText}</span>);

    const fields = [
      { 
        label: t('labels.phone'), 
        value: staff?.phoneNumber || staff?.phone_number || notAvailable
      },
      {
        label: t('labels.experience'),
        value: experienceValue
      },
      { 
        label: t('labels.joined'), 
        value: staff?.createdAt ? new Date(staff.createdAt).toLocaleDateString(i18n?.language || undefined) : notAvailable
      }
    ];

    if (staff?.assignedDoctorId) {
      fields.push({
        label: t('labels.assigned'),
        value: t('labels.yes')
      });
    }

    if (staff?.emailVerified !== undefined) {
      fields.push({
        label: t('labels.verified'),
        value: staff.emailVerified ? t('labels.yes') : t('labels.no')
      });
    }

    if (staff?.hiringProposalStatus) {
      fields.push({
        label: t('talentPool.labels.offerStatus'),
        value: t(`talentPool.proposalStatus.${staff.hiringProposalStatus}`, staff.hiringProposalStatus)
      });
    }

    return fields;
  };

  return (
    <StaffCardContainer className={className}>
      <UserCard
        user={staff}
        userType={showRole ? t(`roles.${staff?.role || 'receptionist'}`, { defaultValue: staff?.role || '' }) : undefined}
        onClick={onClick}
        actions={actions.length > 0 ? actions : getDefaultActions()}
        metaFields={getMetaFields()}
      />
    </StaffCardContainer>
  );
};

export default StaffCard;

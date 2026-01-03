import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import StaffList from '../components/StaffList';
import useStaffManagement from '../hooks/useStaffManagement';
import { AuthContext } from './../../auth/context/AuthContext';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 32px 24px;
  
  @media (max-width: 768px) {
    padding: 20px 16px;
  }
`;

const PageHeader = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 
              0 4px 16px rgba(99, 102, 241, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.8);
  
  @media (max-width: 768px) {
    padding: 24px;
    border-radius: 20px;
  }
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 36px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const PageSubtitle = styled.p`
  margin: 8px 0 0 0;
  color: #64748b;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: 12px 28px;
  border: none;
  border-radius: 10px;
  background: #6366f1;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #4f46e5;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const HeaderStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 24px;
`;

const StatCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e1;
  }
`;

const StatValue = styled.div`
  font-size: 36px;
  font-weight: 700;
  color: #6366f1;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: #64748b;
  color: ${props => props.$color || '#64748b'};
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
`;

const StatIcon = styled.div`
  font-size: 24px;
  margin-bottom: 12px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
`;

const MainContent = styled.div`
  display: grid;
  gap: 24px;
`;


const LoadingMessage = styled.div`
  text-align: center;
  padding: 48px;
  color: #64748b;
  font-size: 16px;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 48px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.8);
`;

const EmptyStateIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.7;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
`;

const EmptyStateTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 22px;
  font-weight: 700;
  color: #1a202c;
  letter-spacing: -0.01em;
`;

const EmptyStateDescription = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 15px;
  line-height: 1.6;
`;

const StaffManagementPage = () => {
  const { t } = useTranslation('staff');
  const { doctorId } = useContext(AuthContext);
  const navigate = useNavigate();

  const {
    receptionists,
    loading,
    error,
    fetchStaff,
    dismissReceptionist,
    clearError
  } = useStaffManagement();

  useEffect(() => {
    if (doctorId) {
      fetchStaff(doctorId);
    }
  }, [fetchStaff, doctorId]);


  const stats = {
    total: receptionists.length,
    active: receptionists.filter(r => r.isActive).length,
    inactive: receptionists.filter(r => !r.isActive).length,
    assigned: receptionists.filter(r => r.assignedDoctorId).length
  };

  const handleStaffAction = async (action, staff) => {
    try {
      switch (action) {
        case 'dismiss':
          if (window.confirm(t('messages.confirmDismiss', { name: staff.fullName }))) {
            const reason = window.prompt(t('messages.dismissReasonPrompt'));
            if (!reason || !reason.trim()) {
              return;
            }
            await dismissReceptionist(staff.id, reason.trim());
          }
          break;
        default:
          console.log('Action not implemented:', action);
      }
    } catch (error) {
      console.error('Error performing staff action:', error);
    }
  };


  return (
    <PageContainer>
      <PageHeader>
        <HeaderTop>
          <div>
            <PageTitle>{t('page.title')}</PageTitle>
            <PageSubtitle>
              {t('page.subtitle')}
            </PageSubtitle>
          </div>

          <HeaderActions>
            <ActionButton className="secondary" onClick={() => navigate('/staff-management/history')}>
              {t('history.viewButton')}
            </ActionButton>
          </HeaderActions>
        </HeaderTop>

        <HeaderStats>
          <StatCard $gradient="#dbeafe 0%, #bfdbfe 100%">
            <StatIcon>👥</StatIcon>
            <StatValue $color="#1e40af">{stats.total}</StatValue>
            <StatLabel $color="#1e40af">{t('stats.totalStaff')}</StatLabel>
          </StatCard>
          
          <StatCard $gradient="#d1fae5 0%, #a7f3d0 100%">
            <StatIcon>✅</StatIcon>
            <StatValue $color="#059669">{stats.active}</StatValue>
            <StatLabel $color="#059669">{t('stats.active')}</StatLabel>
          </StatCard>
          
          <StatCard $gradient="#fee2e2 0%, #fecaca 100%">
            <StatIcon>❌</StatIcon>
            <StatValue $color="#dc2626">{stats.inactive}</StatValue>
            <StatLabel $color="#dc2626">{t('stats.inactive')}</StatLabel>
          </StatCard>
          
          <StatCard $gradient="#fef3c7 0%, #fde68a 100%">
            <StatIcon>📋</StatIcon>
            <StatValue $color="#d97706">{stats.assigned}</StatValue>
            <StatLabel $color="#d97706">{t('stats.assigned')}</StatLabel>
          </StatCard>
        </HeaderStats>
      </PageHeader>

      {error && (
        <ErrorMessage>
          {error}
          <button 
            onClick={clearError}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'inherit', 
              float: 'right',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </ErrorMessage>
      )}

      <MainContent>
        {loading ? (
          <LoadingMessage>{t('messages.loadingStaff')}</LoadingMessage>
        ) : receptionists.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon>👥</EmptyStateIcon>
            <EmptyStateTitle>
              {t('messages.noStaffTitle')}
            </EmptyStateTitle>
            <EmptyStateDescription>
              {t('messages.noStaffDescription')}
            </EmptyStateDescription>
          </EmptyState>
        ) : (
          <StaffList 
            staff={receptionists}
            onStaffSelect={(staff) => staff?.id && navigate(`/receptionist-profile/${staff.id}`)}
            onDismiss={(staff) => handleStaffAction('dismiss', staff)}
            onBulkAction={(staffIds, action) => console.log('Bulk action:', action, staffIds)}
          />
        )}
      </MainContent>
    </PageContainer>
  );
};

export default StaffManagementPage;

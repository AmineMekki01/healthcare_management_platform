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
  padding: 24px;
`;

const PageHeader = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #1a202c;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const PageSubtitle = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 16px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  }
  
  &.secondary {
    background: white;
    color: #667eea;
    border: 2px solid #667eea;
    
    &:hover {
      background: #667eea;
      color: white;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const HeaderStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 24px;
`;

const StatCard = styled.div`
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, ${props => props.$gradient || '#f8fafc 0%, #e2e8f0 100%'});
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const StatNumber = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.$color || '#1a202c'};
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: ${props => props.$color || '#64748b'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatIcon = styled.div`
  font-size: 16px;
  margin-bottom: 8px;
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
  padding: 48px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const EmptyStateIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const EmptyStateTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #1a202c;
`;

const EmptyStateDescription = styled.p`
  margin: 0;
  color: #64748b;
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
    activateReceptionist,
    deactivateReceptionist,
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
        case 'activate':
          await activateReceptionist(staff.id);
          break;
        case 'deactivate':
          await deactivateReceptionist(staff.id);
          break;
        case 'dismiss':
          if (window.confirm(t('messages.confirmDismiss', { name: staff.fullName }))) {
            await dismissReceptionist(staff.id);
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
        </HeaderTop>

        <HeaderStats>
          <StatCard $gradient="#dbeafe 0%, #bfdbfe 100%">
            <StatIcon>👥</StatIcon>
            <StatNumber $color="#1e40af">{stats.total}</StatNumber>
            <StatLabel $color="#1e40af">{t('stats.totalStaff')}</StatLabel>
          </StatCard>
          
          <StatCard $gradient="#d1fae5 0%, #a7f3d0 100%">
            <StatIcon>✅</StatIcon>
            <StatNumber $color="#059669">{stats.active}</StatNumber>
            <StatLabel $color="#059669">{t('stats.active')}</StatLabel>
          </StatCard>
          
          <StatCard $gradient="#fee2e2 0%, #fecaca 100%">
            <StatIcon>❌</StatIcon>
            <StatNumber $color="#dc2626">{stats.inactive}</StatNumber>
            <StatLabel $color="#dc2626">{t('stats.inactive')}</StatLabel>
          </StatCard>
          
          <StatCard $gradient="#fef3c7 0%, #fde68a 100%">
            <StatIcon>📋</StatIcon>
            <StatNumber $color="#d97706">{stats.assigned}</StatNumber>
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
            onActivate={(staff) => handleStaffAction('activate', staff)}
            onDeactivate={(staff) => handleStaffAction('deactivate', staff)}
            onDismiss={(staff) => handleStaffAction('dismiss', staff)}
            onBulkAction={(staffIds, action) => console.log('Bulk action:', action, staffIds)}
          />
        )}
      </MainContent>
    </PageContainer>
  );
};

export default StaffManagementPage;

import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { AuthContext } from '../../auth/context/AuthContext';
import staffService from '../services/staffService';

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

const ContentCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 28px 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.8);
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const Row = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 18px;
  margin-bottom: 12px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  direction: ${props => props.$rtl ? 'rtl' : 'ltr'};
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border-color: #cbd5e1;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Name = styled.div`
  font-weight: 700;
  font-size: 16px;
  color: #0f172a;
  margin-bottom: 6px;
  letter-spacing: -0.01em;
`;

const Meta = styled.div`
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 500;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => (props.$variant === 'active' ? '#d1fae5' : '#fee2e2')};
  color: ${props => (props.$variant === 'active' ? '#059669' : '#dc2626')};
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 48px;
  color: #64748b;
  font-size: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 48px;
  color: #64748b;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
`;

const EmptyDescription = styled.p`
  margin: 0;
  font-size: 14px;
`;

const ReceptionistHistoryPage = () => {
  const { t, i18n } = useTranslation('staff');
  const { doctorId } = useContext(AuthContext);
  const isArabic = (i18n?.language || '').toLowerCase().startsWith('ar');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const loadHistory = useCallback(async () => {
    if (!doctorId) {
      setError(t('errors.doctorIdRequired'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await staffService.fetchDoctorStaffEmploymentHistory(doctorId);
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [doctorId, t]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const getLocalizedName = (item) => {
    if (isArabic && item?.receptionistNameAr) {
      return item.receptionistNameAr;
    }
    return item?.receptionistName || item?.receptionistId || t('history.unknownReceptionist');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(i18n?.language || 'en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>{t('history.title')}</PageTitle>
        <PageSubtitle>{t('history.subtitle')}</PageSubtitle>
      </PageHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {loading ? (
        <LoadingMessage>{t('list.loading')}</LoadingMessage>
      ) : (
        <ContentCard>
          {history.length === 0 ? (
            <EmptyState>
              <EmptyIcon>📋</EmptyIcon>
              <EmptyTitle>{t('history.empty')}</EmptyTitle>
              <EmptyDescription>{t('history.emptyDescription')}</EmptyDescription>
            </EmptyState>
          ) : (
            history.map((item) => {
              const name = getLocalizedName(item);
              const startedAt = formatDate(item?.startedAt);
              const endedAt = item?.endedAt ? formatDate(item.endedAt) : null;
              const isActive = !endedAt;

              return (
                <Row key={item?.employmentId || `${item?.receptionistId}-${item?.startedAt}`} $rtl={isArabic}> 
                  <div style={{ flex: 1 }}>
                    <Name>{name}</Name>
                    <Meta>
                      {t('history.labels.startedAt')}: {startedAt}
                      {endedAt && (
                        <>
                          {' • '}
                          {t('history.labels.endedAt')}: {endedAt}
                        </>
                      )}
                      {item?.dismissedReason && (
                        <>
                          <br />
                          {t('history.labels.reason')}: {item.dismissedReason}
                        </>
                      )}
                    </Meta>
                  </div>
                  <Badge $variant={isActive ? 'active' : 'inactive'}>
                    {isActive ? '●' : '○'}
                    {' '}
                    {isActive ? t('history.status.active') : t('history.status.ended')}
                  </Badge>
                </Row>
              );
            })
          )}
        </ContentCard>
      )}
    </PageContainer>
  );
};

export default ReceptionistHistoryPage;

import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { AuthContext } from '../../auth/context/AuthContext';
import staffService from '../services/staffService';

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
  margin: 8px 0 0 0;
  color: #64748b;
  font-size: 16px;
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const Row = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }
`;

const Name = styled.div`
  font-weight: 600;
  color: #0f172a;
`;

const Meta = styled.div`
  color: #64748b;
  font-size: 13px;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => (props.$variant === 'active' ? '#dcfce7' : '#fee2e2')};
  color: ${props => (props.$variant === 'active' ? '#166534' : '#991b1b')};
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

const ReceptionistHistoryPage = () => {
  const { t } = useTranslation('staff');
  const { doctorId } = useContext(AuthContext);

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
            <Meta>{t('history.empty')}</Meta>
          ) : (
            history.map((item) => {
              const name = item?.receptionistName || item?.receptionistId;
              const startedAt = item?.startedAt ? new Date(item.startedAt).toLocaleString() : '';
              const endedAt = item?.endedAt ? new Date(item.endedAt).toLocaleString() : null;
              const isActive = !endedAt;

              return (
                <Row key={item?.employmentId || `${item?.receptionistId}-${item?.startedAt}`}> 
                  <div>
                    <Name>{name}</Name>
                    <Meta>
                      {t('history.labels.startedAt')}: {startedAt}
                      {endedAt ? ` • ${t('history.labels.endedAt')}: ${endedAt}` : ''}
                      {item?.dismissedReason ? ` • ${t('history.labels.reason')}: ${item.dismissedReason}` : ''}
                    </Meta>
                  </div>
                  <Badge $variant={isActive ? 'active' : 'inactive'}>
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

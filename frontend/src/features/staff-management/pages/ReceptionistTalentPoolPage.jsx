import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import StaffCard from '../components/StaffCard';
import useStaffManagement from '../hooks/useStaffManagement';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 32px 24px;
  
  @media (max-width: 768px) {
    padding: 20px 16px;
  }
`;

const PageHeader = styled.div`
  background: white;
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 
              0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  
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

const FilterContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FilterLabel = styled.label`
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
`;

const FilterSelect = styled.select`
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }
  
  &:hover {
    border-color: #cbd5e1;
  }
`;

const SearchInput = styled.input`
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  min-width: 240px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }
  
  &:hover {
    border-color: #cbd5e1;
  }
  
  &::placeholder {
    color: #94a3b8;
  }
`;

const FilterButton = styled.button`
  padding: 10px 20px;
  border: 2px solid ${props => props.$active ? '#8b5cf6' : '#e2e8f0'};
  border-radius: 8px;
  background: ${props => props.$active ? '#8b5cf6' : 'white'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.$active ? '#7c3aed' : '#cbd5e1'};
    background: ${props => props.$active ? '#7c3aed' : '#f8fafc'};
  }
`;

const ActionButton = styled.button`
  padding: 12px 28px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.primary {
    background: #3b82f6;
    color: white;
    box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px 0 rgba(59, 130, 246, 0.4);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  &.secondary {
    background: white;
    color: #3b82f6;
    border: 2px solid #3b82f6;
    
    &:hover {
      background: #3b82f6;
      color: white;
      box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const StatCard = styled.div`
  text-align: center;
  padding: 16px 20px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e1;
  }
`;

const StatNumber = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: ${props => props.$color || '#1a202c'};
  margin-bottom: 4px;
  letter-spacing: -0.02em;
`;

const StatLabel = styled.div`
  font-size: 10px;
  color: ${props => props.$color || '#64748b'};
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 600;
`;

const MainContent = styled.div`
  display: grid;
  gap: 24px;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
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

const ReceptionistTalentPoolPage = () => {
  const { t } = useTranslation('staff');
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    experienceLevel: '',
    availability: '',
    sortBy: 'name'
  });

  const {
    talentPool,
    hiringProposals,
    loading,
    error,
    fetchTalentPool,
    fetchHiringProposals,
    hireReceptionist,
    clearError
  } = useStaffManagement();

  const [hiringInFlight, setHiringInFlight] = useState(new Set());

  useEffect(() => {
    fetchTalentPool();
    fetchHiringProposals();
  }, [fetchTalentPool, fetchHiringProposals]);

  const proposalByReceptionistId = useMemo(() => {
    const map = new Map();
    (hiringProposals || []).forEach((p) => {
      const rid = p?.receptionistId;
      if (!rid) return;
      const key = String(rid);
      if (!map.has(key)) {
        map.set(key, p);
      }
    });
    return map;
  }, [hiringProposals]);

  const filteredTalentPool = useCallback(() => {
    let filtered = [...talentPool];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(person => 
        person.fullName?.toLowerCase().includes(searchLower) ||
        person.email?.toLowerCase().includes(searchLower) ||
        person.specialization?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.experienceLevel) {
      filtered = filtered.filter(person => {
        const experience = person.experience || 0;
        switch (filters.experienceLevel) {
          case 'entry': return experience < 2;
          case 'mid': return experience >= 2 && experience < 5;
          case 'senior': return experience >= 5;
          default: return true;
        }
      });
    }

    if (filters.availability) {
      filtered = filtered.filter(person => {
        const isAvailable = !person.assignedDoctorId;
        switch (filters.availability) {
          case 'available': return isAvailable;
          case 'busy': return !isAvailable;
          default: return true;
        }
      });
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return (a.fullName || '').localeCompare(b.fullName || '');
        case 'experience':
          return (b.experience || 0) - (a.experience || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [talentPool, filters]);

  const filteredData = filteredTalentPool();

  const stats = {
    total: talentPool.length,
    available: talentPool.filter(p => !p.assignedDoctorId).length,
    experienced: talentPool.filter(p => (p.experienceYears || p.experience || 0) >= 3).length,
    topRated: talentPool.filter(p => (p.rating || 0) >= 4.5).length
  };

  const handleHire = async (receptionistId) => {
    if (!receptionistId) return;

    const existing = proposalByReceptionistId.get(String(receptionistId));
    const existingStatus = String(existing?.status || '').toLowerCase();
    if (existingStatus === 'sent') {
      return;
    }

    setHiringInFlight(prev => {
      const next = new Set(prev);
      next.add(String(receptionistId));
      return next;
    });

    try {
      const message = window.prompt(t('talentPool.messages.offerPrompt'));
      await hireReceptionist(receptionistId, { message: message || '' });
      window.alert(t('talentPool.messages.offerSent'));
      await Promise.all([fetchTalentPool(), fetchHiringProposals()]);
    } catch (error) {
      const msg = error?.message || '';
      if (String(msg).toLowerCase().includes('already sent')) {
        window.alert(t('talentPool.messages.offerAlreadySent'));
      } else {
        console.error('Error hiring receptionist:', error);
      }
    } finally {
      setHiringInFlight(prev => {
        const next = new Set(prev);
        next.delete(String(receptionistId));
        return next;
      });
    }
  };

  const handleViewProfile = useCallback((receptionistId) => {
    if (!receptionistId) return;
    navigate(`/receptionist-profile/${receptionistId}`);
  }, [navigate]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  return (
    <PageContainer>
      <PageHeader>
        <HeaderTop>
          <div>
            <PageTitle>{t('talentPool.title')}</PageTitle>
            <PageSubtitle>
              {t('talentPool.subtitle')}
            </PageSubtitle>
          </div>
          
          <ActionButton 
            className="primary"
            onClick={() => fetchTalentPool()}
            disabled={loading}
          >
            {loading ? t('talentPool.refreshing') : t('talentPool.refresh')}
          </ActionButton>
        </HeaderTop>

        <FilterContainer>
          <FilterGroup>
            <FilterLabel>{t('talentPool.filters.search')}</FilterLabel>
            <SearchInput
              type="text"
              placeholder={t('talentPool.filters.searchPlaceholder')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>{t('talentPool.filters.experience')}</FilterLabel>
            <FilterSelect 
              value={filters.experienceLevel}
              onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
            >
              <option value="">{t('talentPool.filters.allLevels')}</option>
              <option value="entry">{t('talentPool.filters.entryLevel')}</option>
              <option value="mid">{t('talentPool.filters.midLevel')}</option>
              <option value="senior">{t('talentPool.filters.seniorLevel')}</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>{t('talentPool.filters.availability')}</FilterLabel>
            <FilterSelect 
              value={filters.availability}
              onChange={(e) => handleFilterChange('availability', e.target.value)}
            >
              <option value="">{t('talentPool.filters.all')}</option>
              <option value="available">{t('status.available')}</option>
              <option value="busy">{t('status.busy')}</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>{t('talentPool.filters.sortBy')}</FilterLabel>
            <FilterSelect 
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="name">{t('talentPool.sort.name')}</option>
              <option value="experience">{t('talentPool.sort.experience')}</option>
              <option value="rating">{t('talentPool.sort.rating')}</option>
            </FilterSelect>
          </FilterGroup>
        </FilterContainer>

        <StatsRow>
          <StatCard $gradient="#dbeafe 0%, #bfdbfe 100%">
            <StatNumber $color="#1e40af">{stats.total}</StatNumber>
            <StatLabel $color="#1e40af">{t('talentPool.stats.total')}</StatLabel>
          </StatCard>
          
          <StatCard $gradient="#d1fae5 0%, #a7f3d0 100%">
            <StatNumber $color="#059669">{stats.available}</StatNumber>
            <StatLabel $color="#059669">{t('talentPool.stats.available')}</StatLabel>
          </StatCard>
          
          <StatCard $gradient="#fef3c7 0%, #fde68a 100%">
            <StatNumber $color="#d97706">{stats.experienced}</StatNumber>
            <StatLabel $color="#d97706">{t('talentPool.stats.experienced')}</StatLabel>
          </StatCard>
          
          <StatCard $gradient="#e0e7ff 0%, #c7d2fe 100%">
            <StatNumber $color="#6366f1">{stats.topRated}</StatNumber>
            <StatLabel $color="#6366f1">{t('talentPool.stats.topRated')}</StatLabel>
          </StatCard>
        </StatsRow>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#1a202c' }}>
            {t('talentPool.availableReceptionists', { count: filteredData.length })}
          </h2>
        </div>

        {loading ? (
          <LoadingMessage>{t('talentPool.loading')}</LoadingMessage>
        ) : filteredData.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon>🔍</EmptyStateIcon>
            <EmptyStateTitle>
              {talentPool.length === 0 ? t('talentPool.noReceptionistsTitle') : t('talentPool.noResultsTitle')}
            </EmptyStateTitle>
            <EmptyStateDescription>
              {talentPool.length === 0 
                ? t('talentPool.noReceptionistsDescription')
                : t('talentPool.noResultsDescription')
              }
            </EmptyStateDescription>
          </EmptyState>
        ) : (
          <GridContainer>
            {filteredData && filteredData.map((receptionist) => (
              (() => {
                const existing = proposalByReceptionistId.get(String(receptionist.id));
                const existingStatus = String(existing?.status || '').toLowerCase();
                const isSent = existingStatus === 'sent';
                const isHiring = hiringInFlight.has(String(receptionist.id));

                return (
              <StaffCard
                key={receptionist.id}
                staff={{
                  ...receptionist,
                  hiringProposalStatus: existingStatus || null,
                }}
                onClick={() => handleViewProfile(receptionist.id)}
                actions={[
                  {
                    label: isSent ? t('talentPool.actions.offerAlreadySent') : t('talentPool.actions.hire'),
                    variant: 'primary',
                    onClick: () => handleHire(receptionist.id),
                    disabled: isSent || isHiring || loading
                  },
                  {
                    label: t('talentPool.actions.viewProfile'),
                    variant: 'secondary',
                    onClick: () => handleViewProfile(receptionist.id)
                  }
                ]}
                showRole={true}
                showStatus={true}
              />
                );
              })()
            ))}
          </GridContainer>
        )}
      </MainContent>
    </PageContainer>
  );
};

export default ReceptionistTalentPoolPage;

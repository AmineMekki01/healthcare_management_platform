import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import StaffCard from '../components/StaffCard';
import useStaffManagement from '../hooks/useStaffManagement';

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

const FilterContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 16px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FilterLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #374151;
  width: 200px;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
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

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const StatCard = styled.div`
  text-align: center;
  padding: 12px;
  background: linear-gradient(135deg, ${props => props.$gradient || '#f8fafc 0%, #e2e8f0 100%'});
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const StatNumber = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.$color || '#1a202c'};
  margin-bottom: 2px;
`;

const StatLabel = styled.div`
  font-size: 10px;
  color: ${props => props.$color || '#64748b'};
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const MainContent = styled.div`
  display: grid;
  gap: 24px;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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
    loading,
    error,
    fetchTalentPool,
    hireReceptionist,
    clearError
  } = useStaffManagement();

  useEffect(() => {
    fetchTalentPool();
    console.log('talentPool', talentPool);
  }, [fetchTalentPool]);

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
        switch (filters.availability) {
          case 'available': return person.isAvailable;
          case 'busy': return !person.isAvailable;
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
    available: talentPool.filter(p => p.isAvailable).length,
    experienced: talentPool.filter(p => (p.experience || 0) >= 3).length,
    topRated: talentPool.filter(p => (p.rating || 0) >= 4.5).length
  };

  const handleHire = async (receptionistId) => {
    try {
      await hireReceptionist(receptionistId);
      fetchTalentPool();
    } catch (error) {
      console.error('Error hiring receptionist:', error);
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
              <StaffCard
                key={receptionist.id}
                staff={receptionist}
                onClick={() => handleViewProfile(receptionist.id)}
                actions={[
                  {
                    label: t('talentPool.actions.hire'),
                    variant: 'primary',
                    onClick: () => handleHire(receptionist.id)
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
            ))}
          </GridContainer>
        )}
      </MainContent>
    </PageContainer>
  );
};

export default ReceptionistTalentPoolPage;

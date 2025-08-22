import React, { useState, useEffect, useCallback } from 'react';
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

const HireButton = styled.button`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ReceptionistTalentPoolPage = () => {
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
            <PageTitle>Talent Pool</PageTitle>
            <PageSubtitle>
              Browse and hire qualified receptionists for your practice
            </PageSubtitle>
          </div>
          
          <ActionButton 
            className="primary"
            onClick={() => fetchTalentPool()}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </ActionButton>
        </HeaderTop>

        <FilterContainer>
          <FilterGroup>
            <FilterLabel>Search</FilterLabel>
            <SearchInput
              type="text"
              placeholder="Search by name, email..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Experience</FilterLabel>
            <FilterSelect 
              value={filters.experienceLevel}
              onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="entry">Entry Level (0-2 years)</option>
              <option value="mid">Mid Level (2-5 years)</option>
              <option value="senior">Senior (5+ years)</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Availability</FilterLabel>
            <FilterSelect 
              value={filters.availability}
              onChange={(e) => handleFilterChange('availability', e.target.value)}
            >
              <option value="">All</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Sort By</FilterLabel>
            <FilterSelect 
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="name">Name</option>
              <option value="experience">Experience</option>
              <option value="rating">Rating</option>
            </FilterSelect>
          </FilterGroup>
        </FilterContainer>

        <StatsRow>
          <StatCard $gradient="#dbeafe 0%, #bfdbfe 100%">
            <StatNumber $color="#1e40af">{stats.total}</StatNumber>
            <StatLabel $color="#1e40af">Total</StatLabel>
          </StatCard>
          
          <StatCard $gradient="#d1fae5 0%, #a7f3d0 100%">
            <StatNumber $color="#059669">{stats.available}</StatNumber>
            <StatLabel $color="#059669">Available</StatLabel>
          </StatCard>
          
          <StatCard $gradient="#fef3c7 0%, #fde68a 100%">
            <StatNumber $color="#d97706">{stats.experienced}</StatNumber>
            <StatLabel $color="#d97706">Experienced</StatLabel>
          </StatCard>
          
          <StatCard $gradient="#e0e7ff 0%, #c7d2fe 100%">
            <StatNumber $color="#6366f1">{stats.topRated}</StatNumber>
            <StatLabel $color="#6366f1">Top Rated</StatLabel>
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
            Available Receptionists ({filteredData.length})
          </h2>
        </div>

        {loading ? (
          <LoadingMessage>Loading talent pool...</LoadingMessage>
        ) : filteredData.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon>🔍</EmptyStateIcon>
            <EmptyStateTitle>
              {talentPool.length === 0 ? 'No Receptionists Available' : 'No Results Found'}
            </EmptyStateTitle>
            <EmptyStateDescription>
              {talentPool.length === 0 
                ? 'There are no receptionists in the talent pool at the moment. Please check back later.'
                : 'Try adjusting your search criteria or filters to find more results.'
              }
            </EmptyStateDescription>
          </EmptyState>
        ) : (
          <GridContainer>
            {filteredData && filteredData.map((receptionist) => (
              <StaffCard
                key={receptionist.id}
                staff={receptionist}
                onClick={(staff) => console.log('View profile:', staff)}
                actions={[
                  {
                    label: 'Hire',
                    variant: 'primary',
                    onClick: () => handleHire(receptionist.id)
                  },
                  {
                    label: 'View Profile',
                    variant: 'secondary',
                    onClick: (staff) => console.log('View profile:', staff)
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

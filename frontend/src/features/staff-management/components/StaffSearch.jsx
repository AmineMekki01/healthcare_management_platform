import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import StaffCard from './StaffCard';
import useStaffManagement from '../hooks/useStaffManagement';

const SearchContainer = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const SearchHeader = styled.div`
  padding: 24px;
  background: #6366f1;
  color: white;
`;

const SearchTitle = styled.h2`
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
`;

const SearchInputContainer = styled.div`
  position: relative;
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 16px;
  backdrop-filter: blur(10px);
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SearchButton = styled.button`
  padding: 12px 24px;
  background: white;
  border: 2px solid white;
  border-radius: 8px;
  color: #6366f1;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f8fafc;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
`;

const FilterSelect = styled.select`
  padding: 10px 12px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  backdrop-filter: blur(10px);
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
  }
  
  option {
    background: #1a202c;
    color: white;
  }
`;

const AdvancedFilters = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`;

const FilterToggle = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    color: white;
  }
`;

const SearchBody = styled.div`
  padding: 24px;
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ResultsCount = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 14px;
`;

const ViewOptions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 4px;
`;

const ViewButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: ${props => props.$active ? '#667eea' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const SortSelect = styled.select`
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #1a202c;
  font-size: 12px;
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: ${props => props.$view === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr'};
  gap: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #1a202c;
`;

const EmptyDescription = styled.p`
  margin: 0;
  font-size: 14px;
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: #64748b;
`;

const ErrorState = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
`;

const QuickFilters = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const QuickFilterButton = styled.button`
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: ${props => props.$active ? '#667eea' : 'white'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #667eea;
    color: ${props => props.$active ? 'white' : '#667eea'};
  }
`;

const StaffSearch = ({ 
  onStaffSelect,
  onStaffEdit,
  onViewSchedule,
  showAdvancedFilters = true,
  initialQuery = '',
  className 
}) => {
  const { t } = useTranslation('staff');
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState({
    role: '',
    experience: '',
    specialization: '',
    shift: ''
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [view, setView] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [hasSearched, setHasSearched] = useState(false);
  const [quickFilter, setQuickFilter] = useState('');

  const [searchTimeout, setSearchTimeout] = useState(null);

  const { 
    searchResults, 
    loading, 
    error, 
    searchStaff, 
    clearError,
    clearSearchResults 
  } = useStaffManagement();

  const performSearch = useCallback(async (searchQuery, searchFilters) => {
    setHasSearched(true);
    clearError();
    
    try {
      await searchStaff(searchQuery, searchFilters);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [searchStaff, clearError, setHasSearched]);

  const debouncedSearch = useCallback((searchQuery, searchFilters) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (searchQuery.trim() || Object.values(searchFilters).some(f => f)) {
        performSearch(searchQuery, searchFilters);
      }
    }, 300);

    setSearchTimeout(timeout);
  }, [searchTimeout, performSearch]);

  const handleSearch = () => {
    performSearch(query, filters);
  };

  const handleInputChange = (value) => {
    setQuery(value);
    debouncedSearch(value, filters);
  };

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);
    debouncedSearch(query, newFilters);
  };

  const handleQuickFilter = (filterType) => {
    if (quickFilter === filterType) {
      setQuickFilter('');
      setFilters({ ...filters, role: '' });
    } else {
      setQuickFilter(filterType);
      setFilters({ ...filters, role: filterType });
    }
  };

  const clearAllFilters = () => {
    setQuery('');
    setFilters({
      role: '',
      experience: '',
      specialization: '',
      shift: ''
    });
    setQuickFilter('');
    clearSearchResults();
    setHasSearched(false);
  };

  const handleStaffClick = (staff) => {
    if (onStaffSelect) {
      onStaffSelect(staff);
    }
  };

  const getStaffActions = (staff) => {
    const actions = [
      {
        label: t('actions.viewProfile'),
        variant: 'primary',
        onClick: handleStaffClick
      },
      {
        label: t('actions.edit'),
        variant: 'secondary',
        onClick: (staff) => onStaffEdit?.(staff)
      }
    ];

    if (staff.role === 'doctor') {
      actions.push({
        label: t('actions.viewSchedule'),
        variant: 'secondary',
        onClick: (staff) => onViewSchedule?.(staff)
      });
    }

    return actions;
  };

  const filteredResults = [...searchResults].filter((staff) => {
    if (!filters.experience) return true;

    const years = typeof staff?.experienceYears === 'number'
      ? staff.experienceYears
      : (typeof staff?.experience === 'number' ? staff.experience : 0);

    const rangeMatch = typeof filters.experience === 'string' ? filters.experience.match(/^(\d+)\s*-\s*(\d+)$/) : null;
    if (rangeMatch) {
      const min = Number(rangeMatch[1]);
      const max = Number(rangeMatch[2]);
      return years >= min && years <= max;
    }

    const plusMatch = typeof filters.experience === 'string' ? filters.experience.match(/^(\d+)\+$/) : null;
    if (plusMatch) {
      const min = Number(plusMatch[1]);
      return years >= min;
    }

    return true;
  });

  const sortedResults = filteredResults.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'role':
        return (a.role || '').localeCompare(b.role || '');
      case 'experience':
        return (b.experience || 0) - (a.experience || 0);
      default:
        return 0;
    }
  });

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <SearchContainer className={className}>
      <SearchHeader>
        <SearchTitle>{t('search.title')}</SearchTitle>
        
        <SearchInputContainer>
          <SearchInput
            type="text"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <SearchButton 
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? t('search.searching') : t('search.searchButton')}
          </SearchButton>
        </SearchInputContainer>

        <QuickFilters>
          <QuickFilterButton
            $active={quickFilter === 'doctor'}
            onClick={() => handleQuickFilter('doctor')}
          >
            👨‍⚕️ {t('search.quickFilters.doctors')}
          </QuickFilterButton>
          <QuickFilterButton
            $active={quickFilter === 'receptionist'}
            onClick={() => handleQuickFilter('receptionist')}
          >
            👩‍💼 {t('search.quickFilters.receptionists')}
          </QuickFilterButton>
          <QuickFilterButton
            $active={quickFilter === 'nurse'}
            onClick={() => handleQuickFilter('nurse')}
          >
            👩‍⚕️ {t('search.quickFilters.nurses')}
          </QuickFilterButton>
        </QuickFilters>

        {showAdvancedFilters && (
          <AdvancedFilters>
            <FilterToggle onClick={() => setShowAdvanced(!showAdvanced)}>
              {showAdvanced ? '▼' : '▶'} {t('search.advancedFilters')}
            </FilterToggle>
            
            {showAdvanced && (
              <FilterGrid>
                <FilterSelect
                  value={filters.experience}
                  onChange={(e) => handleFilterChange('experience', e.target.value)}
                >
                  <option value="">{t('search.filters.anyExperience')}</option>
                  <option value="0-2">{t('search.filters.experience.junior')}</option>
                  <option value="3-5">{t('search.filters.experience.mid')}</option>
                  <option value="6-10">{t('search.filters.experience.senior')}</option>
                  <option value="10+">{t('search.filters.experience.expert')}</option>
                </FilterSelect>

                <FilterSelect
                  value={filters.shift}
                  onChange={(e) => handleFilterChange('shift', e.target.value)}
                >
                  <option value="">{t('search.filters.allShifts')}</option>
                  <option value="morning">{t('search.filters.shifts.morning')}</option>
                  <option value="afternoon">{t('search.filters.shifts.afternoon')}</option>
                  <option value="night">{t('search.filters.shifts.night')}</option>
                  <option value="weekend">{t('search.filters.shifts.weekend')}</option>
                </FilterSelect>
              </FilterGrid>
            )}
          </AdvancedFilters>
        )}
      </SearchHeader>

      <SearchBody>
        {error && (
          <ErrorState>
            {t('search.error')}: {error}
          </ErrorState>
        )}

        {hasSearched && (
          <ResultsHeader>
            <ResultsCount>
              {loading ? t('search.searching') : t('search.resultsFound', { count: sortedResults.length })}
            </ResultsCount>
            <ViewOptions>
              <SortSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">{t('search.sort.name')}</option>
                <option value="role">{t('search.sort.role')}</option>
                <option value="experience">{t('search.sort.experience')}</option>
              </SortSelect>
              <ViewToggle>
                <ViewButton 
                  $active={view === 'grid'} 
                  onClick={() => setView('grid')}
                >
                  {t('search.views.grid')}
                </ViewButton>
                <ViewButton 
                  $active={view === 'list'} 
                  onClick={() => setView('list')}
                >
                  {t('search.views.list')}
                </ViewButton>
              </ViewToggle>
            </ViewOptions>
          </ResultsHeader>
        )}

        {(hasSearched || query || Object.values(filters).some(f => f)) && (
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={clearAllFilters}
              style={{
                padding: '6px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: 'white',
                color: '#64748b',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {t('search.clearAllFilters')}
            </button>
          </div>
        )}

        {loading && (
          <LoadingState>
            {t('search.searchingStaff')}
          </LoadingState>
        )}

        {!loading && hasSearched && sortedResults.length === 0 && (
          <EmptyState>
            <EmptyIcon>🔍</EmptyIcon>
            <EmptyTitle>{t('search.noResultsTitle')}</EmptyTitle>
            <EmptyDescription>
              {t('search.noResultsDescription')}
            </EmptyDescription>
          </EmptyState>
        )}

        {!loading && !hasSearched && (
          <EmptyState>
            <EmptyIcon>👥</EmptyIcon>
            <EmptyTitle>{t('search.searchPromptTitle')}</EmptyTitle>
            <EmptyDescription>
              {t('search.searchPromptDescription')}
            </EmptyDescription>
          </EmptyState>
        )}

        {!loading && sortedResults.length > 0 && (
          <ResultsGrid $view={view}>
            {sortedResults.map((staff) => (
              <StaffCard
                key={staff.id}
                staff={staff}
                onClick={handleStaffClick}
                onEdit={onStaffEdit}
                onViewSchedule={onViewSchedule}
                actions={getStaffActions(staff)}
              />
            ))}
          </ResultsGrid>
        )}
      </SearchBody>
    </SearchContainer>
  );
};

export default StaffSearch;

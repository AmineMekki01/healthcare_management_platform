import React, { useState, useEffect, useCallback } from 'react';
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
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
  onManagePermissions,
  showAdvancedFilters = true,
  initialQuery = '',
  className 
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    department: '',
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
  }, [searchTimeout]);

  const performSearch = async (searchQuery, searchFilters) => {
    setHasSearched(true);
    clearError();
    
    try {
      await searchStaff(searchQuery, searchFilters);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

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
      status: '',
      department: '',
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
        label: 'View Profile',
        variant: 'primary',
        onClick: handleStaffClick
      },
      {
        label: 'Edit',
        variant: 'secondary',
        onClick: (staff) => onStaffEdit?.(staff)
      }
    ];

    if (staff.role === 'doctor') {
      actions.push({
        label: 'View Schedule',
        variant: 'secondary',
        onClick: (staff) => onViewSchedule?.(staff)
      });
    }

    if (staff.role === 'receptionist') {
      actions.push({
        label: 'Manage Permissions',
        variant: 'secondary',
        onClick: (staff) => onManagePermissions?.(staff)
      });
    }

    return actions;
  };

  const sortedResults = [...searchResults].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'role':
        return (a.role || '').localeCompare(b.role || '');
      case 'department':
        return (a.department || '').localeCompare(b.department || '');
      case 'experience':
        return (b.experience || 0) - (a.experience || 0);
      case 'status':
        return (a.status || '').localeCompare(b.status || '');
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
        <SearchTitle>Staff Search</SearchTitle>
        
        <SearchInputContainer>
          <SearchInput
            type="text"
            placeholder="Search by name, role, specialization, or department..."
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <SearchButton 
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </SearchButton>
        </SearchInputContainer>

        <QuickFilters>
          <QuickFilterButton
            $active={quickFilter === 'doctor'}
            onClick={() => handleQuickFilter('doctor')}
          >
            👨‍⚕️ Doctors
          </QuickFilterButton>
          <QuickFilterButton
            $active={quickFilter === 'receptionist'}
            onClick={() => handleQuickFilter('receptionist')}
          >
            👩‍💼 Receptionists
          </QuickFilterButton>
          <QuickFilterButton
            $active={quickFilter === 'nurse'}
            onClick={() => handleQuickFilter('nurse')}
          >
            👩‍⚕️ Nurses
          </QuickFilterButton>
          <QuickFilterButton
            $active={filters.status === 'available'}
            onClick={() => handleFilterChange('status', filters.status === 'available' ? '' : 'available')}
          >
            🟢 Available
          </QuickFilterButton>
        </QuickFilters>

        {showAdvancedFilters && (
          <AdvancedFilters>
            <FilterToggle onClick={() => setShowAdvanced(!showAdvanced)}>
              {showAdvanced ? '▼' : '▶'} Advanced Filters
            </FilterToggle>
            
            {showAdvanced && (
              <FilterGrid>
                <FilterSelect
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                  <option value="break">On Break</option>
                </FilterSelect>

                <FilterSelect
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                  <option value="">All Departments</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="neurology">Neurology</option>
                  <option value="orthopedics">Orthopedics</option>
                  <option value="pediatrics">Pediatrics</option>
                  <option value="emergency">Emergency</option>
                </FilterSelect>

                <FilterSelect
                  value={filters.experience}
                  onChange={(e) => handleFilterChange('experience', e.target.value)}
                >
                  <option value="">Any Experience</option>
                  <option value="0-2">0-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="6-10">6-10 years</option>
                  <option value="10+">10+ years</option>
                </FilterSelect>

                <FilterSelect
                  value={filters.shift}
                  onChange={(e) => handleFilterChange('shift', e.target.value)}
                >
                  <option value="">All Shifts</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="night">Night</option>
                  <option value="weekend">Weekend</option>
                </FilterSelect>
              </FilterGrid>
            )}
          </AdvancedFilters>
        )}
      </SearchHeader>

      <SearchBody>
        {error && (
          <ErrorState>
            Error: {error}
          </ErrorState>
        )}

        {hasSearched && (
          <ResultsHeader>
            <ResultsCount>
              {loading ? 'Searching...' : `${sortedResults.length} staff members found`}
            </ResultsCount>
            <ViewOptions>
              <SortSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Sort by Name</option>
                <option value="role">Sort by Role</option>
                <option value="department">Sort by Department</option>
                <option value="experience">Sort by Experience</option>
                <option value="status">Sort by Status</option>
              </SortSelect>
              <ViewToggle>
                <ViewButton 
                  $active={view === 'grid'} 
                  onClick={() => setView('grid')}
                >
                  Grid
                </ViewButton>
                <ViewButton 
                  $active={view === 'list'} 
                  onClick={() => setView('list')}
                >
                  List
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
              Clear All Filters
            </button>
          </div>
        )}

        {loading && (
          <LoadingState>
            Searching staff members...
          </LoadingState>
        )}

        {!loading && hasSearched && sortedResults.length === 0 && (
          <EmptyState>
            <EmptyIcon>🔍</EmptyIcon>
            <EmptyTitle>No staff members found</EmptyTitle>
            <EmptyDescription>
              Try adjusting your search terms or filters
            </EmptyDescription>
          </EmptyState>
        )}

        {!loading && !hasSearched && (
          <EmptyState>
            <EmptyIcon>👥</EmptyIcon>
            <EmptyTitle>Search for staff members</EmptyTitle>
            <EmptyDescription>
              Enter a name, role, or department to get started
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
                onManagePermissions={onManagePermissions}
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

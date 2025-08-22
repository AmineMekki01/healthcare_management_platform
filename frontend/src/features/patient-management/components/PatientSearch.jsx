import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { UserCard } from '../../user-management';
import { usePatientManagement } from '../hooks/usePatientManagement';

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

const FiltersContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
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

const ViewToggle = styled.div`
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 4px;
`;

const ViewButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: ${props => props.$active ? '#667eea' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: ${props => props.$view === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr'};
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

const PatientSearch = ({ 
  onPatientSelect,
  showFilters = true,
  initialQuery = '',
  className 
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState({
    status: '',
    ageRange: '',
    gender: '',
    dateRange: ''
  });
  const [view, setView] = useState('grid');
  const [hasSearched, setHasSearched] = useState(false);

  const { 
    searchResults, 
    loading, 
    error, 
    searchPatients, 
    clearError 
  } = usePatientManagement();

  const [searchTimeout, setSearchTimeout] = useState(null);

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
      await searchPatients(searchQuery, searchFilters);
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

  const handlePatientClick = (patient) => {
    if (onPatientSelect) {
      onPatientSelect(patient);
    }
  };

  const getPatientActions = (patient) => [
    {
      label: 'View Profile',
      variant: 'primary',
      onClick: handlePatientClick
    },
    {
      label: 'Book Appointment',
      variant: 'secondary',
      onClick: (patient) => {
        console.log('Book appointment for', patient);
      }
    }
  ];

  const getPatientMetaFields = (patient) => [
    { label: 'Age', value: patient.age || 'N/A' },
    { label: 'Gender', value: patient.gender || 'N/A' },
    { label: 'Last Visit', value: patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never' },
    { label: 'Status', value: patient.isActive ? 'Active' : 'Inactive' }
  ];

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
        <SearchTitle>Patient Search</SearchTitle>
        <SearchInputContainer>
          <SearchInput
            type="text"
            placeholder="Search by name, email, phone, or ID..."
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

        {showFilters && (
          <FiltersContainer>
            <FilterSelect
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FilterSelect>

            <FilterSelect
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </FilterSelect>

            <FilterSelect
              value={filters.ageRange}
              onChange={(e) => handleFilterChange('ageRange', e.target.value)}
            >
              <option value="">All Ages</option>
              <option value="0-18">0-18 years</option>
              <option value="19-35">19-35 years</option>
              <option value="36-50">36-50 years</option>
              <option value="51-65">51-65 years</option>
              <option value="65+">65+ years</option>
            </FilterSelect>
          </FiltersContainer>
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
              {loading ? 'Searching...' : `${searchResults.length} patients found`}
            </ResultsCount>
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
          </ResultsHeader>
        )}

        {loading && (
          <LoadingState>
            Searching patients...
          </LoadingState>
        )}

        {!loading && hasSearched && searchResults.length === 0 && (
          <EmptyState>
            <EmptyIcon>🔍</EmptyIcon>
            <EmptyTitle>No patients found</EmptyTitle>
            <EmptyDescription>
              Try adjusting your search terms or filters
            </EmptyDescription>
          </EmptyState>
        )}

        {!loading && !hasSearched && (
          <EmptyState>
            <EmptyIcon>👥</EmptyIcon>
            <EmptyTitle>Search for patients</EmptyTitle>
            <EmptyDescription>
              Enter a name, email, phone number, or patient ID to get started
            </EmptyDescription>
          </EmptyState>
        )}

        {!loading && searchResults.length > 0 && (
          <ResultsGrid $view={view}>
            {searchResults.map((patient) => (
              <UserCard
                key={patient.id}
                user={patient}
                onClick={handlePatientClick}
                actions={getPatientActions(patient)}
                metaFields={getPatientMetaFields(patient)}
              />
            ))}
          </ResultsGrid>
        )}
      </SearchBody>
    </SearchContainer>
  );
};

export default PatientSearch;

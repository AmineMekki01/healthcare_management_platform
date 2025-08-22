import React, { useState, useEffect, useCallback} from 'react';
import axios from '../../../components/axiosConfig';
import DoctorCard from './DoctorCard';
import { 
  AppContainer, 
  SearchPageHeader,
  SearchInputContainer, 
  SearchInputsRow,
  SearchInput, 
  SymptomInputContainer,
  SymptomInput,
  UserList, 
  AnalyzeButton,
  ResultsHeader,
  LoadingSpinner,
  EmptyState,
  QuickFiltersContainer,
  QuickFilterButton,
  SearchSuggestions,
  SuggestionGrid,
  SuggestionCard,
  ClearButton,
  SearchActionsContainer
} from '../styles/SearchBarStyles';
import { debounce } from 'lodash';

const SearchBar = () => {

  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [searchParams, setSearchParams] = useState({ query: '', specialty: '', location: '' });
  const [userLatitude, setUserLatitude] = useState(null);
  const [userLongitude, setUserLongitude] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const popularSpecialties = [
    'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 
    'Neurology', 'Psychiatry', 'Internal Medicine', 'Surgery'
  ];

  const searchSuggestions = [
    {
      title: 'General Health Checkup',
      specialty: 'Internal Medicine',
      description: 'Regular health monitoring and preventive care'
    },
    {
      title: 'Heart Problems',
      specialty: 'Cardiology', 
      description: 'Chest pain, irregular heartbeat, blood pressure issues'
    },
    {
      title: 'Skin Issues',
      specialty: 'Dermatology',
      description: 'Rashes, acne, moles, skin conditions'
    },
    {
      title: 'Mental Health',
      specialty: 'Psychiatry',
      description: 'Anxiety, depression, stress management'
    }
  ];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLatitude(position.coords.latitude);
          setUserLongitude(position.coords.longitude);
        },
        (error) => {
          console.error('Error getting user location:', error);
          alert('Unable to retrieve your location. Please enable location services for better search results.');
          setUserLatitude(null);
          setUserLongitude(null);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParams({
        query: query,
        specialty: specialty,
        location: location
      });
      if (query || specialty || location) {
        setShowSuggestions(false);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [query, specialty, location]);

  const fetchUsers = async () => {
    const { query, specialty, location } = searchParams;
    if (query || specialty || location || (userLatitude && userLongitude)) {
      setIsLoading(true);
      setHasSearched(true);
      try {
        const response = await axios.get(
          `http://localhost:3001/api/v1/doctors`,
          {
            params: {
              query,
              specialty,
              location,
              latitude: userLatitude,
              longitude: userLongitude,
            },
          }
        );
        console.log('API response:', response.data);
        if (response.status === 200) {
          if (Array.isArray(response.data)) {
            setUsers(response.data);
          } else if (response.data == null) {
            setUsers([]);
          } else {
            setUsers([response.data]);
          }
        } else {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }
      } catch (error) {
        console.error(
          'API error:',
          error.response ? error.response.data : error.message
        );
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const debouncedFetchUsers = useCallback(debounce(() => {
    fetchUsers();
  }, 500), [searchParams]);

  useEffect(() => {
    debouncedFetchUsers();
  }, [debouncedFetchUsers, userLatitude, userLongitude]);

  useEffect(() => {
    if (searchParams.specialty) {
        fetchUsers();
      }
  }, [searchParams.specialty]);


  const analyzeAndRecommendDoctor = async () => {
    if (!userQuery.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    try {
      const specialtyResponse = await axios.post('http://localhost:8000/api/v1/analyze_symptoms_and_recommend_doctor', { userQuery });
      if (specialtyResponse.data && specialtyResponse.data.doctors && specialtyResponse.data.doctors.length > 0) {
        const newSpecialty = specialtyResponse.data.doctors[0].specialty;
        setSpecialty(newSpecialty);
        setSearchParams(prev => ({ ...prev, specialty: newSpecialty }));

        const doctorsResponse = await axios.get(`http://localhost:3001/api/v1/doctors`, {
            params: { query: '', specialty: newSpecialty, location: '' }
        });

        if (doctorsResponse.status === 200) { 
            setUsers(doctorsResponse.data);
        } else {
            console.error('Failed to fetch doctors:', doctorsResponse.status);
        }
      }
    } catch (error) {
        console.error('Error in analyzeAndRecommendDoctor:', error);
        setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = Array.isArray(users) ? users.filter((user) => 
    (
      ((user && user.firstName) || '').toLowerCase().startsWith(query.toLowerCase()) &&
      ((user && user.specialty) || '').toLowerCase().startsWith(specialty.toLowerCase()) &&
      ((user && user.location) || '').toLowerCase().includes(location.toLowerCase())
    )
  ) : [];

  const handleQuickFilter = (filterSpecialty) => {
    setSpecialty(filterSpecialty);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setSpecialty(suggestion.specialty);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setQuery('');
    setSpecialty('');
    setLocation('');
    setUserQuery('');
    setUsers([]);
    setHasSearched(false);
    setShowSuggestions(true);
    setSearchParams({ query: '', specialty: '', location: '' });
  };

  return (
    <AppContainer className="app mt-6">
      <SearchPageHeader>
        <h1>Find Your Doctor</h1>
        <p>Search for healthcare professionals by name, specialty, location, or describe your symptoms for AI-powered recommendations</p>
      </SearchPageHeader>

      <SearchInputContainer>
        <SearchInputsRow>
          <SearchInput
            type="text"
            placeholder="Search by Name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <SearchInput
            type="text"
            placeholder="Search by specialty..."
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
          <SearchInput
            type="text"
            placeholder="Search by Location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </SearchInputsRow>

        <QuickFiltersContainer>
          {popularSpecialties.map((spec) => (
            <QuickFilterButton
              key={spec}
              className={specialty === spec ? 'active' : ''}
              onClick={() => handleQuickFilter(spec)}
            >
              {spec}
            </QuickFilterButton>
          ))}
        </QuickFiltersContainer>

        <SymptomInputContainer>
          <SymptomInput
            type="text"
            placeholder="Describe your symptoms for AI-powered doctor recommendations..."
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
          />
          <SearchActionsContainer>
            <AnalyzeButton onClick={analyzeAndRecommendDoctor} disabled={!userQuery.trim() || isLoading}>
              {isLoading ? 'Analyzing...' : 'Analyze Symptoms'}
            </AnalyzeButton>
            {(query || specialty || location || userQuery || hasSearched) && (
              <ClearButton onClick={clearSearch}>
                Clear All
              </ClearButton>
            )}
          </SearchActionsContainer>
        </SymptomInputContainer>
      </SearchInputContainer>

      {showSuggestions && !hasSearched && (
        <SearchSuggestions>
          <h3>Popular Health Concerns</h3>
          <SuggestionGrid>
            {searchSuggestions.map((suggestion, index) => (
              <SuggestionCard
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <h4>{suggestion.title}</h4>
                <p>{suggestion.description}</p>
              </SuggestionCard>
            ))}
          </SuggestionGrid>
        </SearchSuggestions>
      )}

      {isLoading && <LoadingSpinner />}

      {!isLoading && hasSearched && (
        <ResultsHeader>
          <h2>Search Results</h2>
          <p>{filteredUsers.length} doctor{filteredUsers.length !== 1 ? 's' : ''} found</p>
        </ResultsHeader>
      )}

      {!isLoading && hasSearched && filteredUsers.length === 0 && (
        <EmptyState>
          <h3>No doctors found</h3>
          <p>Try adjusting your search criteria or location</p>
        </EmptyState>
      )}

      {!isLoading && filteredUsers.length > 0 && (
        <UserList className='flex flex-wrap justify-center'>
          {filteredUsers.map((user, index) => {
            return (
              <li key={index}>
                <DoctorCard
                  doctor={user}
                  onClick={(doctor) => {
                    console.log('Selected doctor:', doctor);
                  }}
                />
              </li>
            );
          })}
        </UserList>
      )}

    </AppContainer>
  );
};

export default SearchBar;

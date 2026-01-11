import React, { useState, useEffect, useCallback} from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation(['search', 'medical']);
  
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [userQuery, setUserQuery] = useState('');
  const [searchParams, setSearchParams] = useState({ query: '', specialty: '', location: '', sort: 'relevance' });
  const [userLatitude, setUserLatitude] = useState(null);
  const [userLongitude, setUserLongitude] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const popularSpecialties = [
    { key: 'cardiology', label: t('medical:specialties.cardiology') },
    { key: 'dermatology', label: t('medical:specialties.dermatology') },
    { key: 'pediatrics', label: t('medical:specialties.pediatrics') },
    { key: 'orthopedics', label: t('medical:specialties.orthopedics') },
    { key: 'neurology', label: t('medical:specialties.neurology') },
    { key: 'psychiatry', label: t('medical:specialties.psychiatry') },
    { key: 'internalMedicine', label: t('medical:specialties.internalMedicine') },
    { key: 'surgery', label: t('medical:specialties.surgery') }
  ];


  const searchSuggestions = [
    {
      title: t('suggestions.generalCheckup.title'),
      specialty: t('medical:specialties.internalMedicine'),
      description: t('suggestions.generalCheckup.description')
    },
    {
      title: t('suggestions.heartProblems.title'),
      specialty: t('medical:specialties.cardiology'), 
      description: t('suggestions.heartProblems.description')
    },
    {
      title: t('suggestions.skinIssues.title'),
      specialty: t('medical:specialties.dermatology'),
      description: t('suggestions.skinIssues.description')
    },
    {
      title: t('suggestions.mentalHealth.title'),
      specialty: t('medical:specialties.psychiatry'),
      description: t('suggestions.mentalHealth.description')
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
          alert(t('messages.locationError'));
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
        location: location,
        sort: sortBy
      });
      if (query || specialty || location) {
        setShowSuggestions(false);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [query, specialty, location, sortBy]);

  const fetchUsers = useCallback(async () => {
    const { query, specialty, location, sort } = searchParams;
    if (hasSearched || query || specialty || location || (userLatitude && userLongitude)) {
      setIsLoading(true);
      setHasSearched(true);
      try {
        const { searchService } = await import('../services/searchService');
        
        const searchResults = await searchService.searchDoctors({
          query,
          specialty,
          location,
          sort: sort,
          latitude: userLatitude,
          longitude: userLongitude,
        }, i18n.language);
        
        console.log('Search results:', searchResults);
        setUsers(searchResults);
      } catch (error) {
        console.error('Search error:', error.message);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [searchParams, userLatitude, userLongitude, i18n.language, hasSearched]);

  const debouncedFetchUsers = useCallback(debounce(() => {
    fetchUsers();
  }, 500), [fetchUsers]);

  useEffect(() => {
    debouncedFetchUsers();
  }, [debouncedFetchUsers]);


  const analyzeAndRecommendDoctor = async () => {
    if (!userQuery.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    try {
      const { searchService } = await import('../services/searchService');
      
      const analysisResult = await searchService.analyzeSymptoms(userQuery, 
        userLatitude && userLongitude ? { latitude: userLatitude, longitude: userLongitude } : null
      );
      
      if (analysisResult.recommendedSpecialty) {
        const newSpecialty = analysisResult.recommendedSpecialty;
        setSpecialty(newSpecialty);
        setSearchParams(prev => ({ ...prev, specialty: newSpecialty }));

        const searchResults = await searchService.searchDoctors({
          specialty: newSpecialty,
          sort: sortBy,
          latitude: userLatitude,
          longitude: userLongitude
        }, i18n.language);

        setUsers(searchResults);
      } else if (analysisResult.doctors && analysisResult.doctors.length > 0) {
        setUsers(analysisResult.doctors);
      }
    } catch (error) {
        console.error('Error in analyzeAndRecommendDoctor:', error);
        setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = Array.isArray(users) ? users : [];

  const handleQuickFilter = async (specialtyObj) => {
    setSpecialty(specialtyObj.label);
    setShowSuggestions(false);
    
    if (i18n.language !== 'en') {
      const { findEnglishEquivalent } = await import('../utils/translationMaps');
      const englishSpecialty = findEnglishEquivalent(specialtyObj.label, i18n.language);
      setSearchParams(prev => ({ ...prev, specialty: englishSpecialty }));
    } else {
      setSearchParams(prev => ({ ...prev, specialty: specialtyObj.label }));
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSpecialty(suggestion.specialty);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setQuery('');
    setSpecialty('');
    setLocation('');
    setSortBy('relevance');
    setUserQuery('');
    setUsers([]);
    setHasSearched(false);
    setShowSuggestions(true);
    setSearchParams({ query: '', specialty: '', location: '', sort: 'relevance' });
  };

  return (
    <AppContainer className="app mt-6">
      <SearchPageHeader>
        <h1>{t('header.title')}</h1>
        <p>{t('header.subtitle')}</p>
      </SearchPageHeader>

      <SearchInputContainer>
        <SearchInputsRow>
          <SearchInput
            type="text"
            placeholder={t('placeholders.searchByName')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <SearchInput
            type="text"
            placeholder={i18n.language === 'ar' ? 'مثال: طبيب قلب، طب الأطفال' : 
                        i18n.language === 'fr' ? 'Ex: cardiologue, pédiatre' : 
                        t('placeholders.searchBySpecialty')}
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
          <SearchInput
            type="text"
            placeholder={i18n.language === 'ar' ? 'مثال: الدار البيضاء، الرباط' : 
                        i18n.language === 'fr' ? 'Ex: Casablanca, Rabat' : 
                        t('placeholders.searchByLocation')}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <SearchInput
            as="select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="relevance">{t('sort.relevance')}</option>
            <option value="availability">{t('sort.availability')}</option>
          </SearchInput>
        </SearchInputsRow>

        <QuickFiltersContainer>
          {popularSpecialties.map((spec) => (
            <QuickFilterButton
              key={spec.key}
              className={specialty === spec.label ? 'active' : ''}
              onClick={() => handleQuickFilter(spec)}
            >
              {spec.label}
            </QuickFilterButton>
          ))}
        </QuickFiltersContainer>

        <SymptomInputContainer>
          <SymptomInput
            type="text"
            placeholder={t('placeholders.describeSymptoms')}
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
          />
          <SearchActionsContainer>
            <AnalyzeButton onClick={analyzeAndRecommendDoctor} disabled={!userQuery.trim() || isLoading}>
              {isLoading ? t('buttons.analyzing') : t('buttons.analyzeSymptoms')}
            </AnalyzeButton>
            {(query || specialty || location || userQuery || hasSearched) && (
              <ClearButton onClick={clearSearch}>
                {t('buttons.clearAll')}
              </ClearButton>
            )}
          </SearchActionsContainer>
        </SymptomInputContainer>
      </SearchInputContainer>

      {showSuggestions && !hasSearched && (
        <SearchSuggestions>
          <h3>{t('suggestions.title')}</h3>
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
          <h2>{t('results.title')}</h2>
          <p>{t('results.doctorsFound', { count: filteredUsers.length })}</p>
        </ResultsHeader>
      )}

      {!isLoading && hasSearched && filteredUsers.length === 0 && (
        <EmptyState>
          <h3>{t('results.noDoctorsTitle')}</h3>
          <p>{t('results.noDoctorsMessage')}</p>
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

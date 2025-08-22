import { useState, useCallback, useEffect, useRef } from 'react';
import { searchService } from '../services/searchService';
import { 
  validateSearchFilters, 
  formatSearchError, 
  debounceSearch,
  getSearchMetrics,
  generateSearchSuggestions,
  calculateRelevanceScore
} from '../utils/searchUtils';

export const useSearch = (initialFilters = {}) => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    query: '',
    specialty: '',
    location: '',
    minRating: 0,
    maxDistance: null,
    availableToday: false,
    ...initialFilters
  });
  
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchMetrics, setSearchMetrics] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [symptomAnalysis, setSymptomAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  
  const searchTimeoutRef = useRef(null);
  const searchStartTimeRef = useRef(null);
  const abortControllerRef = useRef(null);

  const debouncedSearch = useCallback(
    debounceSearch((searchFilters) => {
      performSearch(searchFilters);
    }, 300),
    []
  );

  const performSearch = useCallback(async (searchFilters = filters) => {
    const validation = validateSearchFilters(searchFilters);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    searchStartTimeRef.current = Date.now();

    try {
      const results = await searchService.searchDoctors(searchFilters);
      
      const scoredResults = results.map(doctor => ({
        ...doctor,
        relevanceScore: calculateRelevanceScore(doctor, searchFilters)
      }));

      setDoctors(scoredResults);
      setFilteredDoctors(scoredResults);
      setHasSearched(true);

      const metrics = getSearchMetrics(searchStartTimeRef.current, results.length);
      setSearchMetrics(metrics);

      saveRecentSearch(searchFilters, results.length);

      console.log(`Search completed: ${results.length} results in ${metrics.durationFormatted}`);

    } catch (err) {
      if (err.name !== 'AbortError') {
        const errorMessage = formatSearchError(err);
        setError(errorMessage);
        console.error('Search failed:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const searchByQuery = useCallback((query) => {
    const newFilters = { ...filters, query: query?.trim() || '' };
    setFilters(newFilters);
    
    if (query?.trim()) {
      debouncedSearch(newFilters);
      updateSearchSuggestions(query);
    } else {
      setDoctors([]);
      setFilteredDoctors([]);
      setHasSearched(false);
    }
  }, [filters, debouncedSearch]);

  const applyFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    
    if (doctors.length > 0) {
      const filtered = searchService.filterDoctors(doctors, { ...filters, ...newFilters });
      setFilteredDoctors(filtered);
    }
  }, [doctors, filters]);

  const analyzeSymptoms = useCallback(async (symptomQuery) => {
    if (!symptomQuery?.trim()) {
      setError('Please describe your symptoms');
      return;
    }

    setAnalysisLoading(true);
    setError(null);

    try {
      const analysis = await searchService.analyzeSymptoms(symptomQuery, userLocation);
      setSymptomAnalysis(analysis);

      if (analysis.doctors && analysis.doctors.length > 0) {
        setDoctors(analysis.doctors);
        setFilteredDoctors(analysis.doctors);
        setHasSearched(true);
      }

      if (analysis.recommendedSpecialty) {
        setFilters(prev => ({
          ...prev,
          specialty: analysis.recommendedSpecialty
        }));
      }

    } catch (err) {
      const errorMessage = formatSearchError(err);
      setError(errorMessage);
      console.error('Symptom analysis failed:', err);
    } finally {
      setAnalysisLoading(false);
    }
  }, [userLocation]);

  const getUserLocation = useCallback(async () => {
    setLocationLoading(true);
    setError(null);

    try {
      const location = await searchService.getUserLocation();
      setUserLocation(location);
      console.log('Location obtained:', location);
    } catch (err) {
      const errorMessage = formatSearchError(err);
      setError(errorMessage);
      console.error('Location access failed:', err);
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const searchNearby = useCallback(async (radius = 50) => {
    if (!userLocation) {
      await getUserLocation();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nearbyDoctors = await searchService.getNearbyDoctors(userLocation, radius);
      setDoctors(nearbyDoctors);
      setFilteredDoctors(nearbyDoctors);
      setHasSearched(true);
      
      console.log(`Found ${nearbyDoctors.length} nearby doctors within ${radius}km`);
    } catch (err) {
      const errorMessage = formatSearchError(err);
      setError(errorMessage);
      console.error('Nearby search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [userLocation, getUserLocation]);

  const clearSearch = useCallback(() => {
    setDoctors([]);
    setFilteredDoctors([]);
    setFilters({
      query: '',
      specialty: '',
      location: '',
      minRating: 0,
      maxDistance: null,
      availableToday: false
    });
    setError(null);
    setHasSearched(false);
    setSymptomAnalysis(null);
    setSearchMetrics(null);
    setSearchSuggestions([]);
  }, []);

  const retrySearch = useCallback(() => {
    if (hasSearched) {
      performSearch(filters);
    }
  }, [hasSearched, filters, performSearch]);

  const saveRecentSearch = useCallback((searchFilters, resultCount) => {
    const searchEntry = {
      id: Date.now(),
      query: searchFilters.query,
      specialty: searchFilters.specialty,
      location: searchFilters.location,
      resultCount,
      timestamp: new Date().toISOString()
    };

    setRecentSearches(prev => {
      const updated = [searchEntry, ...prev.filter(s => s.query !== searchFilters.query)];
      return updated.slice(0, 10);
    });

    try {
      localStorage.setItem('recent-searches', JSON.stringify([searchEntry, ...recentSearches.slice(0, 9)]));
    } catch (err) {
      console.warn('Failed to save recent search:', err);
    }
  }, [recentSearches]);

  const updateSearchSuggestions = useCallback((input) => {
    const suggestions = generateSearchSuggestions(input);
    setSearchSuggestions(suggestions);
  }, []);


  const applyRecentSearch = useCallback((recentSearch) => {
    const searchFilters = {
      query: recentSearch.query || '',
      specialty: recentSearch.specialty || '',
      location: recentSearch.location || '',
      minRating: 0,
      maxDistance: null,
      availableToday: false
    };
    
    setFilters(searchFilters);
    performSearch(searchFilters);
  }, [performSearch]);


  const getDoctorById = useCallback(async (doctorId) => {
    const cached = doctors.find(d => d.id === doctorId || d.userId === doctorId);
    if (cached) return cached;

    try {
      const doctor = await searchService.getDoctorById(doctorId);
      return doctor;
    } catch (err) {
      console.error('Failed to get doctor:', err);
      throw new Error('Failed to load doctor details');
    }
  }, [doctors]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('recent-searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (err) {
      console.warn('Failed to load recent searches:', err);
    }
  }, []);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const isSearching = loading || analysisLoading;
  const hasResults = filteredDoctors.length > 0;
  const isEmpty = hasSearched && filteredDoctors.length === 0;
  const canRetry = error && hasSearched;

  return {
    doctors: filteredDoctors,
    allDoctors: doctors,
    loading: isSearching,
    error,
    filters,
    hasSearched,
    hasResults,
    isEmpty,
    canRetry,
    searchMetrics,
    userLocation,
    locationLoading,
    symptomAnalysis,
    analysisLoading,
    searchSuggestions,
    recentSearches,
    searchByQuery,
    performSearch,
    analyzeSymptoms,
    searchNearby,
    getDoctorById,
    applyFilters,
    setFilters,
    clearSearch,
    retrySearch,
    getUserLocation,
    applyRecentSearch,
    popularSpecialties: searchService.getPopularSpecialties(),
    searchSuggestionsData: searchService.getSearchSuggestions(),
    searchDoctors: performSearch,
    isLoading: isSearching,
    getPopularSpecialties: () => searchService.getPopularSpecialties(),
    getSearchSuggestions: () => searchService.getSearchSuggestions()
  };
};

export default useSearch;

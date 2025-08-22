import { useState, useEffect, useContext } from 'react';
import feedService from '../services/feedService';
import { AuthContext } from './../../../features/auth/context/AuthContext';

export const useFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [specialty, setSpecialty] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { userId, userType } = useContext(AuthContext);

  const specialtyOptions = [
    { value: '', label: 'All Specialties' },
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'neurology', label: 'Neurology' },
    { value: 'pediatrics', label: 'Pediatrics' },
    { value: 'radiology', label: 'Radiology' },
  ];

  const fetchFeed = async () => {
    if (!userId || !userType) return;

    setLoading(true);
    setError(null);

    try {
      const response = await feedService.getFeed({
        specialty: specialty ? specialty.value : '',
        search: searchQuery
      });
      setPosts(response.posts);
    } catch (error) {
      console.error('Error fetching the feed:', error);
      setError('Failed to fetch feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [userId, userType, specialty, searchQuery]);

  return {
    posts,
    loading,
    error,
    specialty,
    setSpecialty,
    searchQuery,
    setSearchQuery,
    specialtyOptions,
    refetch: fetchFeed
  };
};

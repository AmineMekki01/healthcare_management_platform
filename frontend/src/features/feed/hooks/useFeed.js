import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import feedService from '../services/feedService';
import { AuthContext } from './../../../features/auth/context/AuthContext';

export const useFeed = () => {
  const { t } = useTranslation('feed');
  const { t: tMedical } = useTranslation('medical');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [specialty, setSpecialty] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { userId, userType } = useContext(AuthContext);

  const specialtyOptions = [
    { value: '', label: t('filter.placeholder') },
    { value: 'cardiology', label: tMedical('specialties.cardiology') },
    { value: 'neurology', label: tMedical('specialties.neurology') },
    { value: 'pediatrics', label: tMedical('specialties.pediatrics') },
    { value: 'radiology', label: tMedical('specialties.radiology') },
    { value: 'dermatology', label: tMedical('specialties.dermatology') },
    { value: 'oncology', label: tMedical('specialties.oncology') },
    { value: 'psychiatry', label: tMedical('specialties.psychiatry') },
    { value: 'orthopedics', label: tMedical('specialties.orthopedics') },
    { value: 'general', label: tMedical('specialties.generalPractice') },
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
      setError(t('error.message', { error: 'Failed to fetch feed' }));
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

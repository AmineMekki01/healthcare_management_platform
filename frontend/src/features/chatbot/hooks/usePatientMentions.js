import { useState, useContext } from 'react';
import { AuthContext } from '../../auth/context/AuthContext';
import { patientService, messageService } from '../services';

const usePatientMentions = () => {
  const [mentionedPatients, setMentionedPatients] = useState(new Map());
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const { userId } = useContext(AuthContext);

  const searchPatients = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await patientService.searchPatients(query, userId);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching patients:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addPatientMention = (patient) => {
    const patientName = patientService.formatPatientName(patient);
    setMentionedPatients(prev => {
      const updated = new Map(prev);
      updated.set(patientName, patient);
      return updated;
    });
  };

  const removePatientMention = (patientName) => {
    setMentionedPatients(prev => {
      const updated = new Map(prev);
      updated.delete(patientName);
      return updated;
    });
  };

  const extractMentionedPatients = (content) => {
    return messageService.extractMentionedPatients(content, mentionedPatients);
  };

  const createMentionText = (patient) => {
    return patientService.createMentionText(patient);
  };

  const clearMentions = () => {
    setMentionedPatients(new Map());
  };

  return {
    mentionedPatients,
    isSearching,
    searchResults,
    searchPatients,
    addPatientMention,
    removePatientMention,
    extractMentionedPatients,
    createMentionText,
    clearMentions
  };
};

export default usePatientMentions;

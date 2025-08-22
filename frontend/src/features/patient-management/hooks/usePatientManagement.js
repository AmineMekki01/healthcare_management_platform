import { useState, useEffect, useCallback } from 'react';
import { patientService } from '../services/patientService';

export const usePatientManagement = (patientId = null) => {
  const [patient, setPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  const fetchPatient = useCallback(async (id = patientId) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const patientData = await patientService.fetchPatient(id);
      setPatient(patientData);
    } catch (err) {
      setError(err.message || 'Failed to fetch patient');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const fetchPatients = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const patientsData = await patientService.fetchPatients(filters);
      setPatients(patientsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  }, []);


  const searchPatients = useCallback(async (query, filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await patientService.searchPatients(query, filters);
      setSearchResults(results);
      return results;
    } catch (err) {
      setError(err.message || 'Failed to search patients');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPatient = useCallback(async (patientData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newPatient = await patientService.createPatient(patientData);
      setPatients(prev => [newPatient, ...prev]);
      return newPatient;
    } catch (err) {
      setError(err.message || 'Failed to create patient');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePatient = useCallback(async (id, patientData) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedPatient = await patientService.updatePatient(id, patientData);
      
      if (patient && patient.id === id) {
        setPatient(updatedPatient);
      }
      
      setPatients(prev => 
        prev.map(p => p.id === id ? updatedPatient : p)
      );
      
      return updatedPatient;
    } catch (err) {
      setError(err.message || 'Failed to update patient');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [patient]);

  const deletePatient = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await patientService.deletePatient(id);
      
      setPatients(prev => prev.filter(p => p.id !== id));
      
      if (patient && patient.id === id) {
        setPatient(null);
      }
      
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete patient');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [patient]);

  const fetchMedicalHistory = useCallback(async (id = patientId) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const history = await patientService.fetchPatientMedicalHistory(id);
      setMedicalHistory(history);
    } catch (err) {
      setError(err.message || 'Failed to fetch medical history');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const fetchAppointments = useCallback(async (id = patientId, filters = {}) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const appointmentsData = await patientService.fetchPatientAppointments(id, filters);
      setAppointments(appointmentsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const fetchDocuments = useCallback(async (id = patientId) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const documentsData = await patientService.fetchPatientDocuments(id);
      setDocuments(documentsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const addMedicalNote = useCallback(async (id, noteData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newNote = await patientService.addMedicalNote(id, noteData);
      
      setMedicalHistory(prev => [newNote, ...prev]);
      
      return newNote;
    } catch (err) {
      setError(err.message || 'Failed to add medical note');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (id, file, documentType) => {
    setLoading(true);
    setError(null);
    
    try {
      const uploadedDoc = await patientService.uploadPatientDocument(id, file, documentType);
      
      setDocuments(prev => [uploadedDoc, ...prev]);
      
      return uploadedDoc;
    } catch (err) {
      setError(err.message || 'Failed to upload document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePatientStatus = useCallback(async (id, isActive) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedPatient = await patientService.updatePatientStatus(id, isActive);
      
      if (patient && patient.id === id) {
        setPatient(updatedPatient);
      }
      
      setPatients(prev => 
        prev.map(p => p.id === id ? updatedPatient : p)
      );
      
      return updatedPatient;
    } catch (err) {
      setError(err.message || 'Failed to update patient status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [patient]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setPatient(null);
    setPatients([]);
    setMedicalHistory([]);
    setAppointments([]);
    setDocuments([]);
    setSearchResults([]);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (patientId) {
      fetchPatient();
      fetchMedicalHistory();
      fetchAppointments();
      fetchDocuments();
    }
  }, [patientId, fetchPatient, fetchMedicalHistory, fetchAppointments, fetchDocuments]);

  return {
    patient,
    patients,
    medicalHistory,
    appointments,
    documents,
    searchResults,
    loading,
    error,
    fetchPatient,
    fetchPatients,
    searchPatients,
    createPatient,
    updatePatient,
    deletePatient,
    fetchMedicalHistory,
    fetchAppointments,
    fetchDocuments,
    addMedicalNote,
    uploadDocument,
    updatePatientStatus,
    clearError,
    reset,
    hasPatient: !!patient,
    hasPatients: patients.length > 0,
    hasMedicalHistory: medicalHistory.length > 0,
    hasAppointments: appointments.length > 0,
    hasDocuments: documents.length > 0,
    hasSearchResults: searchResults.length > 0,
    isLoading: loading,
    hasError: !!error,
  };
};

export default usePatientManagement;

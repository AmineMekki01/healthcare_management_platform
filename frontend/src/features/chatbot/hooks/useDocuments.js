import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../auth/context/AuthContext';
import { documentService } from '../services';

const useDocuments = (chatId) => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { userId } = useContext(AuthContext);

  const fetchDocuments = useCallback(async () => {
    if (!chatId || !userId) {
      setDocuments([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const documentsData = await documentService.getChatDocuments(chatId, userId);
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  }, [chatId, userId]);

  const uploadDocuments = async (files) => {
    if (!chatId || !userId) {
      throw new Error('Chat ID and User ID are required');
    }

    try {
      setError(null);
      const response = await documentService.uploadDocuments(chatId, userId, files);
      
      await fetchDocuments();
      
      return response;
    } catch (error) {
      console.error('Error uploading documents:', error);
      setError('Failed to upload documents');
      throw error;
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      await documentService.deleteDocument(chatId, documentId, userId);
      setDocuments(prevDocuments => 
        prevDocuments.filter(doc => doc.id !== documentId)
      );
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document');
      throw error;
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [chatId, userId, fetchDocuments]);

  return {
    documents,
    setDocuments,
    isLoading,
    error,
    uploadDocuments,
    deleteDocument,
    fetchDocuments
  };
};

export default useDocuments;

import axiosInstance from '../../../components/axiosConfig';

const API_BASE_URL = 'http://localhost:8000/api/v1/chatbot';

class DocumentService {
  async uploadDocuments(chatId, userId, files) {
    try {
      const results = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        
        const response = await axiosInstance.post(
          `${API_BASE_URL}/chats/${chatId}/documents`,
          formData,
          {
            params: { user_id: userId },
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
        results.push(response.data);
      }

      return results;
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  }


  async getChatDocuments(chatId, userId) {
    try {
      console.log('[DOC_SERVICE] Calling GET documents API for chatId:', chatId, 'userId:', userId);
      const response = await axiosInstance.get(`${API_BASE_URL}/chats/${chatId}/documents`, {
        params: { user_id: userId }
      });
      console.log('[DOC_SERVICE] API response:', response.data);

      if (response.status === 200) {
        const mappedDocs = response.data.documents.map(doc => ({
          id: doc.id,
          filename: doc.filename,
          file_size: doc.file_size,
          storage_type: doc.storage_type,
          token_count: doc.token_count,
          created_at: doc.created_at
        }));
        console.log('[DOC_SERVICE] Mapped documents:', mappedDocs);
        return mappedDocs;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }


  async deleteDocument(chatId, documentId, userId) {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/chats/${chatId}/documents/${documentId}`, {
        params: { user_id: userId }
      });
      
      if (response.status !== 200) {
        throw new Error(`Failed to delete document: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  validateFile(file) {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: 'File type not supported. Please upload PDF, DOC, DOCX, TXT, JPG, JPEG, or PNG files.'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size too large. Maximum size is 10MB.'
      };
    }

    return { isValid: true };
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

const documentService = new DocumentService();
export default documentService;

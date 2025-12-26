import axios from "../../../components/axiosConfig";


const CATEGORY_MAPPING = {
  'lab_results': 'LAB_RESULTS',
  'ct_scan': 'IMAGING_CT',
  'x_ray': 'IMAGING_XRAY',
  'ultrasound': 'IMAGING_US',
  'mammography': 'IMAGING_MAMMO',
  'mri': 'IMAGING_MRI',
  'pet_scan': 'IMAGING_PET',
  'clinical_reports': 'CLINICAL_REPORT',
  'discharge': 'DISCHARGE',
  'other': 'OTHER'
};

class MedicalRecordsService {
  async fetchFolders(userId, userType, parentId = null, isSharedWithMe = false) {
    try {
      const params = { user_id: userId, user_type: userType };
      params.parent_id = parentId;
      params.shared_with_me = isSharedWithMe;

      const response = await axios.get('/api/v1/records/folders', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }
  }

  async fetchBreadcrumbs(folderId) {
    try {
      const response = await axios.get(`/api/v1/records/folders/${folderId}/breadcrumbs`);
      return response.data;
    } catch (error) {
      console.error('Error fetching breadcrumbs:', error);
      throw error;
    }
  }

  async createFolder(name, userId, userType, parentId = null) {
    try {
      const data = {
        name,
        user_id: userId,
        file_type: 'folder',
        user_type: userType,
        parent_id: parentId
      };
      
      const response = await axios.post('/api/v1/records/create-folder', data);
      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async deleteFolder(folderId) {
    try {
      const response = await axios.delete(`/api/v1/records/delete-files/${folderId}`, {
        data: { folderId }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }

  async updateFolderName(folderId, name) {
    try {
      const response = await axios.patch(`/api/v1/records/update-folder/${folderId}`, { name });
      return response.data;
    } catch (error) {
      console.error('Error updating folder name:', error);
      throw error;
    }
  }

  async renameItem(id, name) {
    try {
      const response = await axios.patch('/api/v1/records/rename-item', { id, name });
      return response.data;
    } catch (error) {
      console.error('Error renaming item:', error);
      throw error;
    }
  }

  async uploadFile(file, userId, userType, parentFolderId = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);
      formData.append('parentFolderId', parentFolderId || '');
      formData.append('user_type', userType);
      formData.append('file_type', 'file');
      formData.append('file_name', file.name);
      formData.append('file_size', file.size);
      formData.append('file_ext', file.name.split('.').pop());
      
      const response = await axios.post('/api/v1/records/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async downloadFile(fileId) {
    try {
      const response = await axios.get(`/api/v1/records/download-file/${fileId}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  async downloadMultipleFiles(fileIds, folderName = null) {
    try {
      const requestData = { file_ids: fileIds };
      if (folderName) {
        requestData.folder_name = folderName;
      }
      
      const response = await axios.post('/api/v1/records/download-multiple-files', requestData, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading multiple files:', error);
      throw error;
    }
  }

  async fetchSharedWithMe(userId) {
    try {
      const response = await axios.get(`/api/v1/records/share/shared-with-me?userId=${userId}`);
      return response.data.items || response.data || [];
    } catch (error) {
      console.error('Error fetching shared with me items:', error);
      throw error;
    }
  }

  async fetchSharedByMe(userId) {
    try {
      const response = await axios.get(`/api/v1/records/share/shared-by-me?userId=${userId}`);
      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching shared by me items:', error);
      throw error;
    }
  }

  async shareItems(itemIDs, sharedWithID, userID, userType) {
    try {
      const response = await axios.post('/api/v1/records/share/items', {
        item_ids: itemIDs,
        shared_with_id: sharedWithID,
        user_id: userID,
        user_type: userType,
      });
      return response.data;
    } catch (error) {
      console.error('Error sharing items:', error);
      throw error;
    }
  }

  async fetchDoctors() {
    try {
      const response = await axios.get('/api/v1/records/share/doctors');
      const data = response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  }
  async fetchUsers() {
    try {
      const response = await axios.get(`/api/v1/records/medical-records/all-users`, {
        params: {
          limit: 100,
          offset: 0
        }
      });
      const data = response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  isImageFile(filename) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    return imageExtensions.includes(this.getFileExtension(filename));
  }

  isDocumentFile(filename) {
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
    return documentExtensions.includes(this.getFileExtension(filename));
  }

  isVideoFile(filename) {
    const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'];
    return videoExtensions.includes(this.getFileExtension(filename));
  }

  isAudioFile(filename) {
    const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg'];
    return audioExtensions.includes(this.getFileExtension(filename));
  }

  getFileType(filename) {
    if (this.isImageFile(filename)) return 'image';
    if (this.isDocumentFile(filename)) return 'document';
    if (this.isVideoFile(filename)) return 'video';
    if (this.isAudioFile(filename)) return 'audio';
    return 'other';
  }

  async uploadClinicalDocument(file, patientId, category, uploadedByUserId, uploadedByRole, folderName) {
    try {
      const dbCategory = CATEGORY_MAPPING[category] || category.toUpperCase();
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_id', patientId);
      formData.append('category', dbCategory);
      formData.append('uploaded_by_user_id', uploadedByUserId);
      formData.append('uploaded_by_role', uploadedByRole);
      formData.append('folder_name', folderName);

      const response = await axios.post('/api/v1/records/medical-records/upload-clinical', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading clinical document:', error);
      throw error;
    }
  }

  async shareDocumentToPatient(documentId, patientId, category, uploadedByUserId, uploadedByRole) {
    try {
      const dbCategory = CATEGORY_MAPPING[category] || category.toUpperCase();
      
      const response = await axios.post('/api/v1/records/medical-records/share-to-patient', {
        document_id: documentId,
        patient_id: patientId,
        category: dbCategory,
        uploaded_by_user_id: uploadedByUserId,
        uploaded_by_role: uploadedByRole
      });
      return response.data;
    } catch (error) {
      console.error('Error sharing document to patient:', error);
      throw error;
    }
  }

  async getMedicalRecordsByCategory(userId, userType, category = '', patientId = '') {
    try {      
      const params = new URLSearchParams({
        user_id: userId,
        user_type: userType
      });
      
      if (category) {
        const dbCategory = CATEGORY_MAPPING[category] || category.toUpperCase();
        params.append('category', dbCategory);
      }
      if (patientId) params.append('patient_id', patientId);

      const url = `/api/v1/records/medical-records/by-category?${params}`;

      const response = await axios.get(url);
            
      const records = response.data || [];
      const convertedRecords = records.map(record => ({
        ...record,
        category: this.convertDbCategoryToFrontend(record.category)
      }));
      
      return convertedRecords;
    } catch (error) {
      console.error('Error fetching medical records by category:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }

  convertDbCategoryToFrontend(dbCategory) {
    const reverseMapping = {
      'LAB_RESULTS': 'lab_results',
      'IMAGING_CT': 'ct_scan',
      'IMAGING_XRAY': 'x_ray',
      'IMAGING_US': 'ultrasound',
      'IMAGING_MAMMO': 'mammography',
      'IMAGING_MRI': 'mri',
      'IMAGING_PET': 'pet_scan',
      'CLINICAL_REPORT': 'clinical_reports',
      'DISCHARGE': 'discharge',
      'OTHER': 'other'
    };
    return reverseMapping[dbCategory] || dbCategory?.toLowerCase();
  }
}

const medicalRecordsService = new MedicalRecordsService();
export const fetchFolders = (userId, userType, parentId, isSharedWithMe) => 
  medicalRecordsService.fetchFolders(userId, userType, parentId, isSharedWithMe);

export const fetchBreadcrumbs = (folderId) => 
  medicalRecordsService.fetchBreadcrumbs(folderId);

export const createFolder = (name, userId, userType, parentId) => 
  medicalRecordsService.createFolder(name, userId, userType, parentId);

export const deleteFolder = (folderId) => 
  medicalRecordsService.deleteFolder(folderId);

export const updateFolderName = (folderId, name) => 
  medicalRecordsService.updateFolderName(folderId, name);

export const renameItem = (id, name) => 
  medicalRecordsService.renameItem(id, name);

export const uploadFile = (file, userId, userType, parentFolderId) => 
  medicalRecordsService.uploadFile(file, userId, userType, parentFolderId);

export const downloadFile = (fileId) => 
  medicalRecordsService.downloadFile(fileId);

export const downloadMultipleFiles = (fileIds, folderName) => 
  medicalRecordsService.downloadMultipleFiles(fileIds, folderName);

export const fetchSharedWithMe = (userId) => 
  medicalRecordsService.fetchSharedWithMe(userId);

export const fetchSharedByMe = (userId) => 
  medicalRecordsService.fetchSharedByMe(userId);

export const shareItems = (itemIDs, sharedWithID, userID, userType) => 
  medicalRecordsService.shareItems(itemIDs, sharedWithID, userID, userType);

export const fetchDoctors = () => 
  medicalRecordsService.fetchDoctors();

export const fetchUsers = () => 
  medicalRecordsService.fetchUsers();

export const uploadClinicalDocument = (file, patientId, category, uploadedByUserId, uploadedByRole, folderName) =>
  medicalRecordsService.uploadClinicalDocument(file, patientId, category, uploadedByUserId, uploadedByRole, folderName);

export const shareDocumentToPatient = (documentId, patientId, category, uploadedByUserId, uploadedByRole) =>
  medicalRecordsService.shareDocumentToPatient(documentId, patientId, category, uploadedByUserId, uploadedByRole);

export const getMedicalRecordsByCategory = (userId, userType, category, patientId) =>
  medicalRecordsService.getMedicalRecordsByCategory(userId, userType, category, patientId);

export default medicalRecordsService;
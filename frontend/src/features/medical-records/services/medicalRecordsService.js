import axios from "../../../components/axiosConfig";

class MedicalRecordsService {
  async fetchFolders(userId, userType, parentId = null, isSharedWithMe = false) {
    try {
      const params = { user_id: userId, user_type: userType };
      params.parent_id = parentId;
      params.shared_with_me = isSharedWithMe;

      console.log("Fetching folders with params:", params);
      const response = await axios.get('/api/v1/folders', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }
  }

  async fetchBreadcrumbs(folderId) {
    try {
      const response = await axios.get(`/api/v1/folders/${folderId}/breadcrumbs`);
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
      
      const response = await axios.post('/api/v1/create-folder', data);
      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async deleteFolder(folderId) {
    try {
      const response = await axios.delete(`/api/v1/delete-files/${folderId}`, {
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
      const response = await axios.patch(`/api/v1/update-folder/${folderId}`, { name });
      return response.data;
    } catch (error) {
      console.error('Error updating folder name:', error);
      throw error;
    }
  }

  async renameItem(id, name) {
    try {
      const response = await axios.patch('/api/v1/rename-item', { id, name });
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
      formData.append('userId', userId);
      formData.append('parentFolderId', parentFolderId || '');
      formData.append('userType', userType);
      formData.append('fileType', 'file');
      formData.append('fileName', file.name);
      formData.append('fileSize', file.size);
      formData.append('fileExt', file.name.split('.').pop());

      const response = await axios.post('/api/v1/upload-file', formData, {
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
      const response = await axios.get(`/api/v1/download-file/${fileId}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  async fetchSharedWithMe(userId) {
    try {
      const response = await axios.get(`/api/v1/share/shared-with-me?userId=${userId}`);
      return response.data.items || response.data || [];
    } catch (error) {
      console.error('Error fetching shared with me items:', error);
      throw error;
    }
  }

  async fetchSharedByMe(userId) {
    try {
      const response = await axios.get(`/api/v1/share/shared-by-me?userId=${userId}`);
      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching shared by me items:', error);
      throw error;
    }
  }

  async shareItems(itemIDs, sharedWithID, userID, userType) {
    try {
      const response = await axios.post('/api/v1/share/items', {
        itemIDs,
        sharedWithID,
        userID,
        userType,
      });
      return response.data;
    } catch (error) {
      console.error('Error sharing items:', error);
      throw error;
    }
  }

  async fetchDoctors() {
    try {
      const response = await axios.get('/api/v1/doctors');
      const data = response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching doctors:', error);
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

export const fetchSharedWithMe = (userId) => 
  medicalRecordsService.fetchSharedWithMe(userId);

export const fetchSharedByMe = (userId) => 
  medicalRecordsService.fetchSharedByMe(userId);

export const shareItems = (itemIDs, sharedWithID, userID, userType) => 
  medicalRecordsService.shareItems(itemIDs, sharedWithID, userID, userType);

export const fetchDoctors = () => 
  medicalRecordsService.fetchDoctors();

export default medicalRecordsService;
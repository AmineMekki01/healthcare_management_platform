import { useState, useEffect, useContext } from 'react';
import { AuthContext } from './../../../features/auth/context/AuthContext';
import { 
  fetchFolders, 
  fetchBreadcrumbs, 
  createFolder, 
  deleteFolder, 
  renameItem, 
  downloadFile 
} from '../services/medicalRecordsService';

export const useFileManager = (initialFolderId = null, isSharedWithMe = false) => {
  const { userId, userType } = useContext(AuthContext);
  const [folders, setFolders] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(new Set());

  const loadFolders = async (folderId = null) => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchFolders(userId, userType, folderId, isSharedWithMe);
      setFolders(Array.isArray(data) ? data : []);

      if (folderId) {
        const breadcrumbData = await fetchBreadcrumbs(folderId);
        setBreadcrumbs(Array.isArray(breadcrumbData) ? breadcrumbData : []);
      } else {
        setBreadcrumbs([]);
      }
    } catch (err) {
      console.error('Error loading folders:', err);
      setError('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (folderName, parentId = null) => {
    if (!folderName.trim()) return false;

    try {
      await createFolder(folderName, userId, userType, parentId);
      await loadFolders(parentId);
      return true;
    } catch (err) {
      console.error('Error creating folder:', err);
      setError('Failed to create folder');
      return false;
    }
  };

  const handleDeleteFolder = async (folderId, parentId = null) => {
    try {
      await deleteFolder(folderId);
      await loadFolders(parentId);
      return true;
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError('Failed to delete folder');
      return false;
    }
  };

  const handleRenameItem = async (itemId, newName, isFolder = true, parentId = null) => {
    if (!newName.trim()) return false;

    try {
      await renameItem(itemId, newName, isFolder);
      await loadFolders(parentId);
      return true;
    } catch (err) {
      console.error('Error renaming item:', err);
      setError('Failed to rename item');
      return false;
    }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      await downloadFile(fileId, fileName);
      return true;
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file');
      return false;
    }
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  useEffect(() => {
    loadFolders(initialFolderId);
  }, [userId, userType, initialFolderId, isSharedWithMe]);

  return {
    folders,
    breadcrumbs,
    loading,
    error,
    selectedFiles,
    loadFolders,
    handleCreateFolder,
    handleDeleteFolder,
    handleRenameItem,
    handleDownloadFile,
    toggleFileSelection,
    clearSelection,
    setError
  };
};

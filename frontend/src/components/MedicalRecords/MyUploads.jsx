import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from './../Auth/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FolderCardContainer,
  FolderCard,
  SubHeader,
  PathContainer,
  FolderHandlingContainer,
  HeaderTitle,
  Container,
  CreateFolderButton,
  DeleteFolderButton,
  RenameFolderButton,
  UploadFolderButton,
} from './StyledComponents/MyDocsStyles';
import { fileIconMapper } from './Helpers';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import FolderDeleteIcon from '@mui/icons-material/FolderDelete';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import FileUploadIcon from '@mui/icons-material/FileUpload';

import {
  fetchFolders,
  fetchBreadcrumbs,
  createFolder,
  deleteFolder,
  renameItem,
  downloadFile,
} from './routes/api';

import axios from './../axiosConfig';

function MyUploads() {
  const { userId, userType } = useContext(AuthContext);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const [folders, setFolders] = useState([]);
  const navigate = useNavigate();
  const { folderId } = useParams();
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const fileInputRef = useRef(null);

  const fetchAllFolder = async (folderId) => {
    if (!userId) {
      return;
    }
    try {
      const data = await fetchFolders(userId, userType, folderId);
      setFolders(Array.isArray(data) ? data : []);

      if (folderId) {
        const breadcrumbData = await fetchBreadcrumbs(folderId);
        setBreadcrumbs(Array.isArray(breadcrumbData) ? breadcrumbData : []);
      } else {
        setBreadcrumbs([]);
      }
    } catch (error) {
      console.error('Error during folder fetch:', error);
    }
  };

  useEffect(() => {
    if (!userId) {
      return;
    }
    const newPath = [...currentPath.filter((id) => id !== null)];
    if (folderId && !newPath.includes(folderId)) {
      newPath.push(folderId);
    }
    setCurrentPath(newPath);
    fetchAllFolder(folderId);
  }, [folderId, userId]);

  const navigateToFolder = (subfolderId, file_type) => {
    if (file_type === 'folder') {
      setCurrentPath((prevPath) => {
        const newPath = [...prevPath];
        if (!newPath.includes(subfolderId)) {
          newPath.push(subfolderId);
        }
        return newPath;
      });
      navigate(`/MyDocs/Upload/${subfolderId}`);
      fetchAllFolder(subfolderId);
    }
  };

  function viewFolder(folder) {
    setSelectedFolder(folder.folder_id);
  }

  const onClickCreateFolder = async () => {
    if (!userId) {
      alert('User ID not available.');
      return;
    }
    const name = prompt('Please enter folder name', 'New Folder');
    if (name) {
      const parent_id = currentPath[currentPath.length - 1] || null;
      try {
        await createFolder(name, userId, userType, parent_id);
        fetchAllFolder(parent_id);
      } catch (error) {
        console.error('Error creating folder:', error);
      }
    }
  };

  const navigateUp = () => {
    const newPath = currentPath.slice(0, -1).filter((id) => id != null);
    const parentFolderId = newPath.at(-1) || '';
    navigate(parentFolderId ? `/MyDocs/Upload/${parentFolderId}` : '/MyDocs/Upload');
    setCurrentPath(newPath);
  };

  const toggleFileSelection = (folderId) => {
    setSelectedFiles((prevSelectedFiles) => {
      const newSelection = new Set(prevSelectedFiles);
      if (newSelection.has(folderId)) {
        newSelection.delete(folderId);
        setSelectedFileId(null);
      } else {
        newSelection.add(folderId);
        setSelectedFileId(folderId);
      }
      return newSelection;
    });
  };

  const deleteFolderAndContents = async () => {
    if (!userId) {
      alert('User ID not available.');
      return;
    }
    const userConfirmation = window.confirm(
      'Are you sure you want to delete the selected folders and all of their contents? This action cannot be undone.'
    );

    if (!userConfirmation) {
      return;
    }

    for (const folderId of selectedFiles) {
      try {
        await deleteFolder(folderId);
        setFolders((prevFolders) => prevFolders.filter((folder) => folder.folder_id !== folderId));
        const parent_id = currentPath[currentPath.length - 1] || null;
        fetchAllFolder(parent_id);
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    }
    setSelectedFiles(new Set());
  };

  const onClickRenameItem = async () => {
    if (!userId) {
      alert('User ID not available.');
      return;
    }
    if (selectedFiles.size !== 1) {
      alert('Please select exactly one item to rename.');
      return;
    }

    const itemIdToRename = Array.from(selectedFiles)[0];
    const currentItemName = folders.find((folder) => folder.folder_id === itemIdToRename)?.name;

    const newName = prompt('Please enter the new item name', currentItemName || 'New Item Name');
    if (newName && newName.trim() !== '') {
      try {
        await renameItem(itemIdToRename, newName);
        setFolders(
          folders.map((folder) => {
            if (folder.folder_id === itemIdToRename) {
              return { ...folder, name: newName };
            }
            return folder;
          })
        );
        setSelectedFiles(new Set());
      } catch (error) {
        console.error('Error updating item name:', error);
      }
    }
  };

  const handleFileUpload = async (event) => {
    if (!userId) {
      alert('User ID not available.');
      return;
    }
    const file = event.target.files[0];
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('parentFolderId', currentPath[currentPath.length - 1] || '');
    formData.append('userType', userType);
    formData.append('fileType', 'file');
    formData.append('fileName', file.name);
    formData.append('fileSize', file.size);
    formData.append('fileExt', file.name.split('.').pop());

    try {
      const response = await axios.post('/api/v1/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      fetchAllFolder(currentPath[currentPath.length - 1]);
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file: ' + error.message);
    }
  };

  const handleIconClick = () => {
    fileInputRef.current.click();
  };

  const handleDownload = async (fileId) => {
    try {
      const fileBlob = await downloadFile(fileId);
      const downloadUrl = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'downloadedFile';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error during file download:', error);
    }
  };

  const shareFolder = async (folderId, doctorId) => {
    if (!userId) {
      alert('User ID not available.');
      return;
    }
    if (!doctorId) {
      alert('Please select a doctor to share with.');
      return;
    }
    try {
      const response = await axios.post('/api/v1/share', {
        itemIDs: [folderId],
        sharedWithID: doctorId,
        userID: userId,
        userType: userType,
      });

      alert('Folder shared successfully!');
    } catch (error) {
      console.error('Error sharing folder:', error);
      alert('Error sharing folder: ' + error.message);
    }
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get('/api/v1/doctors');
        const data = response.data;
        setDoctors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      }
    };

    fetchDoctors();
  }, []);

  return (
    <Container>
      <HeaderTitle>My Uploads</HeaderTitle>
      <SubHeader>
        <PathContainer>
          <span>Root</span>
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.folder_id}>
              {' > '}
              <a onClick={() => navigateToFolder(crumb.folder_id, crumb.file_type)}>{crumb.name}</a>
            </span>
          ))}
          {breadcrumbs.length > 0 && (
            <span>
              {' > '}
              <a onClick={navigateUp}>Go Up</a>
            </span>
          )}
        </PathContainer>

        <FolderHandlingContainer>
          <button onClick={() => selectedFileId && handleDownload(selectedFileId)}>Download</button>
          <UploadFolderButton>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <FileUploadIcon onClick={handleIconClick} style={{ cursor: 'pointer' }} />
          </UploadFolderButton>
          <CreateFolderButton type="button" onClick={onClickCreateFolder}>
            <CreateNewFolderIcon></CreateNewFolderIcon>
          </CreateFolderButton>
          <DeleteFolderButton type="button" onClick={() => deleteFolderAndContents(selectedFolder)}>
            <FolderDeleteIcon />
          </DeleteFolderButton>
          <RenameFolderButton
            type="button"
            onClick={onClickRenameItem}
            disabled={selectedFiles.size !== 1}
          >
            <DriveFileRenameOutlineIcon />
          </RenameFolderButton>
          {selectedFiles.size === 1 && (
            <div>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
              >
                <option value="">Select a Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.DoctorId}>
                    {doctor.FirstName} {doctor.LastName}
                  </option>
                ))}
              </select>
              <button
                onClick={() => shareFolder(Array.from(selectedFiles)[0], selectedDoctor)}
              >
                Share with Doctor
              </button>
            </div>
          )}
        </FolderHandlingContainer>
      </SubHeader>
      <FolderCardContainer>
        {folders.map((folder) => {
          const formattedPath = folder.path.replace(/\\/g, '/').replace('uploads/', '');
          const imageUrl = `${formattedPath}`; // Update if necessary

          return (
            <FolderCard key={folder.folder_id} className="col-md-4">
              <input
                type="checkbox"
                checked={selectedFiles.has(folder.folder_id)}
                onChange={() => toggleFileSelection(folder.folder_id)}
              />
              <div
                className="card"
                onClick={() => navigateToFolder(folder.folder_id, folder.file_type)}
              >
                <div className="card-body">
                  <i className="fa fa-folder-o">
                    {fileIconMapper(
                      folder.file_type === 'folder' ? 'folder' : folder.extension,
                      imageUrl
                    )}
                  </i>
                </div>
                <div className="card-footer">
                  <h3>
                    <a href="#" onClick={() => viewFolder(folder)}>
                      {folder.name.substring(0, 20)}
                      {folder.name.length > 20 ? '...' : ''}
                    </a>
                  </h3>
                </div>
              </div>
            </FolderCard>
          );
        })}
      </FolderCardContainer>
    </Container>
  );
}

export default MyUploads;

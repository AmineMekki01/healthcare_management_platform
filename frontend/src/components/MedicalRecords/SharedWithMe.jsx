import React, { useState, useContext } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import {
  FolderCardContainer,
  FolderCard,
  SubHeader,
  PathContainer,
  HeaderTitle,
  Container,
  FolderHandlingContainer,
  DeleteFolderButton,
  RenameFolderButton,
} from './StyledComponents/MyDocsStyles';
import { fileIconMapper } from './Helpers';
import { useNavigate, useParams } from 'react-router-dom';
import { useSharedWithMeNavigation } from '../../hooks/useSharedWithMeNavigation';
import {
  fetchBreadcrumbs,
  renameItem,
  deleteFolder,
  downloadFile,
} from './routes/api';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import FolderDeleteIcon from '@mui/icons-material/FolderDelete';

const SharedWithMe = () => {
  const { userId } = useContext(AuthContext);
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { folders, setFolders, breadcrumbs, currentPath, setCurrentPath } = useSharedWithMeNavigation(
    userId,
    folderId
  );

  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [selectedFileId, setSelectedFileId] = useState(null);

  const navigateToFolder = (subfolderId, file_type) => {
    if (file_type === 'folder') {
      setCurrentPath((prevPath) => {
        const newPath = [...prevPath];
        if (!newPath.includes(subfolderId)) {
          newPath.push(subfolderId);
        }
        return newPath;
      });
      navigate(`/MyDocs/SharedWithMe/${subfolderId}`);
    }
  };

  const navigateUp = () => {
    const newPath = currentPath.slice(0, -1).filter((id) => id != null);
    const parentFolderId = newPath.at(-1) || '';
    navigate(parentFolderId ? `/MyDocs/SharedWithMe/${parentFolderId}` : '/MyDocs/SharedWithMe');
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

  const handleDownload = async (fileId) => {
    try {
      const fileBlob = await downloadFile(fileId);
      const downloadUrl = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Fetch the file name from the server or set a default name
      const fileName = 'downloadedFile';
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error during file download:', error);
    }
  };

  const onClickRenameItem = async () => {
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
        // Update the folder list
        const updatedFolders = folders.map((folder) => {
          if (folder.folder_id === itemIdToRename) {
            return { ...folder, name: newName };
          }
          return folder;
        });
        setFolders(updatedFolders);
        setSelectedFiles(new Set());
      } catch (error) {
        console.error('Error updating item name:', error);
      }
    }
  };

  const deleteFolderAndContents = async () => {
    if (selectedFiles.size === 0) {
      alert('Please select at least one item to delete.');
      return;
    }

    const userConfirmation = window.confirm(
      'Are you sure you want to delete the selected items? This action cannot be undone.'
    );

    if (!userConfirmation) {
      return;
    }

    for (const folderId of selectedFiles) {
      try {
        await deleteFolder(folderId);
        setFolders((prevFolders) => prevFolders.filter((folder) => folder.folder_id !== folderId));
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    }
    setSelectedFiles(new Set());
  };

  return (
    <Container>
      <HeaderTitle>Shared with Me</HeaderTitle>
      <SubHeader>
        <PathContainer>
          <span>Root</span>
          {breadcrumbs.map((crumb) => (
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
          <DeleteFolderButton type="button" onClick={deleteFolderAndContents}>
            <FolderDeleteIcon />
          </DeleteFolderButton>
          <RenameFolderButton
            type="button"
            onClick={onClickRenameItem}
            disabled={selectedFiles.size !== 1}
          >
            <DriveFileRenameOutlineIcon />
          </RenameFolderButton>
        </FolderHandlingContainer>
      </SubHeader>
      <FolderCardContainer>
        {folders &&
          folders.map((item) => {
            const formattedPath = item.path.replace(/\\/g, '/').replace('uploads/', '');
            const imageUrl = `${formattedPath}`;
            return (
              <FolderCard key={item.folder_id} className="col-md-4">
                <input
                  type="checkbox"
                  checked={selectedFiles.has(item.folder_id)}
                  onChange={() => toggleFileSelection(item.folder_id)}
                />
                <div
                  className="card"
                  onClick={() => navigateToFolder(item.folder_id, item.file_type)}
                >
                  <div className="card-body">
                    <i className="fa fa-folder-o">
                      {fileIconMapper(
                        item.file_type === 'folder' ? 'folder' : item.extension,
                        imageUrl
                      )}
                    </i>
                  </div>
                  <div className="card-footer">
                    <h3>
                      <a href="#" onClick={() => navigateToFolder(item.folder_id, item.file_type)}>
                        {item.name.substring(0, 20)}
                        {item.name.length > 20 ? '...' : ''}
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
};

export default SharedWithMe;

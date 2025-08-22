import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from './../../../features/auth/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Fade,
  Breadcrumbs,
  Link,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  Avatar,
  CircularProgress,
  Fab,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CreateNewFolder as CreateNewFolderIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import {
  fetchFolders,
  fetchBreadcrumbs,
  createFolder,
  deleteFolder,
  renameItem,
  downloadFile,
  uploadFile,
  shareItems,
  fetchDoctors,
} from '../services/medicalRecordsService';

function MyUploads() {
  const { userId, userType } = useContext(AuthContext);
  const [currentPath, setCurrentPath] = useState([]);
  const [folders, setFolders] = useState([]);
  const navigate = useNavigate();
  const { folderId } = useParams();
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchAllFolder = async (folderId) => {
    if (!userId) {
      return;
    }
    setLoading(true);
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
    } finally {
      setLoading(false);
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

  const onClickCreateFolder = async () => {
    if (!userId) {
      alert('User ID not available.');
      return;
    }
    const name = prompt('Please enter folder name', 'New Folder');
    if (name && name.trim()) {
      const parent_id = currentPath[currentPath.length - 1] || null;
      try {
        await createFolder(name, userId, userType, parent_id);
        fetchAllFolder(parent_id);
      } catch (error) {
        console.error('Error creating folder:', error);
      }
    }
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
    if (!userId || selectedFiles.size === 0) {
      alert('Please select at least one item to delete.');
      return;
    }
    
    const userConfirmation = window.confirm(
      'Are you sure you want to delete the selected folders and all of their contents? This action cannot be undone.'
    );

    if (!userConfirmation) return;

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
    if (!userId || selectedFiles.size !== 1) {
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

    try {
      setLoading(true);
      await uploadFile(file, userId, userType, currentPath[currentPath.length - 1] || null);
      fetchAllFolder(currentPath[currentPath.length - 1]);
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file: ' + error.message);
    } finally {
      setLoading(false);
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
    if (!userId || !doctorId) {
      alert('Please select a doctor to share with.');
      return;
    }
    try {
      await shareItems([folderId], doctorId, userId, userType);
      alert('Folder shared successfully!');
    } catch (error) {
      console.error('Error sharing folder:', error);
      alert('Error sharing folder: ' + error.message);
    }
  };

  useEffect(() => {
    const fetchDoctorsData = async () => {
      try {
        const doctorsData = await fetchDoctors();
        setDoctors(doctorsData);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      }
    };

    fetchDoctorsData();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 3,
          borderRadius: '12px',
          background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
          border: '1px solid rgba(102, 126, 234, 0.1)',
        }}
      >
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 2 }}
        >
          <Link
            component="button"
            variant="body1"
            onClick={() => navigate('/MyDocs/Upload')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: '#667eea',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
            Root
          </Link>
          {breadcrumbs.map((crumb) => (
            <Link
              key={crumb.folder_id}
              component="button"
              variant="body1"
              onClick={() => navigateToFolder(crumb.folder_id, crumb.file_type)}
              sx={{
                color: '#667eea',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {crumb.name}
            </Link>
          ))}
        </Breadcrumbs>

        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleIconClick}
            disabled={loading}
            sx={{
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            Upload File
          </Button>

          <Button
            variant="outlined"
            startIcon={<CreateNewFolderIcon />}
            onClick={onClickCreateFolder}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#667eea',
              color: '#667eea',
              '&:hover': {
                borderColor: '#5a67d8',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            New Folder
          </Button>

          {selectedFiles.size > 0 && (
            <>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={onClickRenameItem}
                disabled={selectedFiles.size !== 1}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#f59e0b',
                  color: '#f59e0b',
                  '&:hover': {
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  }
                }}
              >
                Rename
              </Button>

              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={deleteFolderAndContents}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  }
                }}
              >
                Delete
              </Button>

              {selectedFileId && (
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownload(selectedFileId)}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#10b981',
                    color: '#10b981',
                    '&:hover': {
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    }
                  }}
                >
                  Download
                </Button>
              )}
            </>
          )}
        </Box>

        {selectedFiles.size === 1 && (
          <Box mt={2} display="flex" gap={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Select Doctor</InputLabel>
              <Select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                label="Select Doctor"
                sx={{ borderRadius: '8px' }}
              >
                <MenuItem value="">
                  <em>Choose a doctor</em>
                </MenuItem>
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.DoctorId}>
                    Dr. {doctor.FirstName} {doctor.LastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<ShareIcon />}
              onClick={() => shareFolder(Array.from(selectedFiles)[0], selectedDoctor)}
              disabled={!selectedDoctor}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669, #047857)',
                }
              }}
            >
              Share with Doctor
            </Button>
          </Box>
        )}
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={60} sx={{ color: '#667eea' }} />
        </Box>
      ) : (
        <Fade in timeout={1000}>
          <Grid container spacing={3}>
            {folders.map((folder, index) => {
              const isFolder = folder.file_type === 'folder';
              
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={folder.folder_id}>
                  <Fade in timeout={1200 + index * 100}>
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: '20px',
                        background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                        border: '1px solid rgba(102, 126, 234, 0.1)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          transform: 'translateY(-8px) scale(1.02)',
                          boxShadow: '0 12px 40px rgba(102, 126, 234, 0.2)',
                          '&::before': {
                            opacity: 1,
                          }
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: 'linear-gradient(90deg, #667eea, #764ba2)',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                        }
                      }}
                      onClick={() => navigateToFolder(folder.folder_id, folder.file_type)}
                    >
                      <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box position="absolute" top={12} right={12}>
                          <Checkbox
                            checked={selectedFiles.has(folder.folder_id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleFileSelection(folder.folder_id);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            sx={{
                              color: '#667eea',
                              '&.Mui-checked': {
                                color: '#667eea',
                              }
                            }}
                          />
                        </Box>

                        <Box 
                          display="flex" 
                          justifyContent="center" 
                          alignItems="center" 
                          mb={2}
                          sx={{ flexGrow: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 80,
                              height: 80,
                              background: isFolder 
                                ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' 
                                : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                              fontSize: '2rem',
                            }}
                          >
                            {isFolder ? <FolderIcon sx={{ fontSize: '2.5rem' }} /> : <DescriptionIcon sx={{ fontSize: '2.5rem' }} />}
                          </Avatar>
                        </Box>

                        <Box textAlign="center">
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600,
                              color: '#2d3748',
                              mb: 0.5,
                              wordBreak: 'break-word',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {folder.name}
                          </Typography>
                          <Chip
                            label={isFolder ? 'Folder' : 'File'}
                            size="small"
                            sx={{
                              backgroundColor: isFolder 
                                ? 'rgba(251, 191, 36, 0.1)' 
                                : 'rgba(59, 130, 246, 0.1)',
                              color: isFolder ? '#f59e0b' : '#3b82f6',
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Fade>
                </Grid>
              );
            })}
          </Grid>
        </Fade>
      )}

      {!loading && folders.length === 0 && (
        <Fade in timeout={1000}>
          <Box 
            textAlign="center" 
            py={8}
            sx={{
              background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
              borderRadius: '20px',
              border: '2px dashed rgba(102, 126, 234, 0.3)',
            }}
          >
            <CloudUploadIcon 
              sx={{ 
                fontSize: 80, 
                color: '#cbd5e1',
                mb: 2 
              }} 
            />
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#64748b',
                fontWeight: 600,
                mb: 1
              }}
            >
              No Files or Folders
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#94a3b8',
                maxWidth: 400,
                mx: 'auto',
                mb: 3
              }}
            >
              Start by uploading your first file or creating a new folder to organize your medical documents.
            </Typography>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={handleIconClick}
              sx={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
              }}
            >
              Upload Your First File
            </Button>
          </Box>
        </Fade>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
            transform: 'scale(1.1)',
          }
        }}
        onClick={handleIconClick}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
}

export default MyUploads;

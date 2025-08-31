import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from './../../../features/auth/context/AuthContext';
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
  Checkbox,
  Avatar,
  CircularProgress,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Description as DescriptionIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  FolderShared as FolderSharedIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  renameItem,
  downloadFile,
  deleteFolder,
  fetchSharedWithMe
} from '../services/medicalRecordsService';

const SharedWithMe = () => {
  const { userId } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [folders, setFolders] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const fetchSharedWithMeItems = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const items = await fetchSharedWithMe(userId);
      setFolders(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error fetching shared with me items:', error);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedWithMeItems();
  }, [userId]);

  const navigateToFolder = (subfolderId, file_type) => {
    console.log('Navigate to shared item:', subfolderId, file_type);
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
      link.download = 'downloadedFile';
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

    if (!userConfirmation) return;

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

  const groupFilesByUser = () => {
    if (!folders || !Array.isArray(folders)) return {};
    
    const grouped = {};
    folders.forEach(item => {
      const userId = item.shared_by_id || 'unknown';
      const userName = item.shared_by_name || 'Unknown User';
      const userType = item.shared_by_type || 'unknown';
      
      if (!grouped[userId]) {
        grouped[userId] = {
          id: userId,
          name: userName,
          type: userType,
          files: []
        };
      }
      grouped[userId].files.push(item);
    });
    
    return grouped;
  };

  const getFilteredGroups = () => {
    const grouped = groupFilesByUser();
    
    if (!searchTerm.trim()) {
      return grouped;
    }
    
    const filtered = {};
    Object.keys(grouped).forEach(userId => {
      const group = grouped[userId];
      if (group.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        filtered[userId] = group;
      } else {
        const matchingFiles = group.files.filter(file => 
          file.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (matchingFiles.length > 0) {
          filtered[userId] = {
            ...group,
            files: matchingFiles
          };
        }
      }
    });
    
    return filtered;
  };

  const toggleGroupExpansion = (userId) => {
    setExpandedGroups(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(userId)) {
        newExpanded.delete(userId);
      } else {
        newExpanded.add(userId);
      }
      return newExpanded;
    });
  };

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
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by user name or file name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#667eea' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: 'white',
              '& fieldset': {
                borderColor: 'rgba(102, 126, 234, 0.2)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(102, 126, 234, 0.4)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#667eea',
              },
            },
          }}
        />
      </Paper>

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
            onClick={() => navigate('/SharedWithMe')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: '#667eea',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
            Shared Root
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

        {selectedFiles.size > 0 && (
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
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
          </Box>
        )}
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={60} sx={{ color: '#10b981' }} />
        </Box>
      ) : (
        <Fade in timeout={1000}>
          <Box>
            {Object.keys(getFilteredGroups()).length === 0 ? (
              <Box 
                textAlign="center" 
                py={8}
                sx={{
                  background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
                  borderRadius: '20px',
                  border: '2px dashed rgba(16, 185, 129, 0.3)',
                }}
              >
                <FolderSharedIcon 
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
                  {searchTerm ? 'No Matching Files' : 'No Shared Files'}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#94a3b8',
                    maxWidth: 400,
                    mx: 'auto'
                  }}
                >
                  {searchTerm 
                    ? 'No files or folders match your search criteria. Try adjusting your search term.'
                    : 'No files or folders have been shared with you yet. When someone shares medical documents with you, they will appear here.'
                  }
                </Typography>
              </Box>
            ) : (
              Object.values(getFilteredGroups()).map((group, groupIndex) => (
                <Fade in timeout={1200 + groupIndex * 100} key={group.id}>
                  <Paper
                    elevation={2}
                    sx={{
                      mb: 3,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                      border: '1px solid rgba(16, 185, 129, 0.1)',
                    }}
                  >
                    <Accordion
                      expanded={expandedGroups.has(group.id)}
                      onChange={() => toggleGroupExpansion(group.id)}
                      sx={{
                        boxShadow: 'none',
                        '&:before': { display: 'none' },
                        backgroundColor: 'transparent',
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: '#10b981' }} />}
                        sx={{
                          backgroundColor: 'rgba(16, 185, 129, 0.05)',
                          borderRadius: '16px',
                          '&.Mui-expanded': {
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                          },
                          '& .MuiAccordionSummary-content': {
                            alignItems: 'center',
                          },
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={2} width="100%">
                          <Avatar
                            sx={{
                              backgroundColor: '#10b981',
                              width: 48,
                              height: 48,
                            }}
                          >
                            <PersonIcon />
                          </Avatar>
                          <Box flexGrow={1}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 600,
                                color: '#2d3748',
                                mb: 0.5,
                              }}
                            >
                              {group.name}
                            </Typography>
                            <Box display="flex" gap={1} alignItems="center">
                              <Chip
                                label={group.type === 'doctor' ? 'Doctor' : 'Patient'}
                                size="small"
                                sx={{
                                  backgroundColor: group.type === 'doctor' 
                                    ? 'rgba(59, 130, 246, 0.1)' 
                                    : 'rgba(16, 185, 129, 0.1)',
                                  color: group.type === 'doctor' ? '#3b82f6' : '#10b981',
                                  fontWeight: 600,
                                }}
                              />
                              <Chip
                                label={`${group.files.length} item${group.files.length !== 1 ? 's' : ''}`}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                  color: '#667eea',
                                  fontWeight: 600,
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                          {group.files.map((item, index) => {
                            const isFolder = item.file_type === 'folder';
                            
                            return (
                              <Grid item xs={12} sm={6} md={4} lg={3} key={item.folder_id}>
                                <Card
                                  sx={{
                                    height: '100%',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                                    border: '1px solid rgba(16, 185, 129, 0.1)',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&:hover': {
                                      transform: 'translateY(-4px) scale(1.02)',
                                      boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)',
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
                                      height: '3px',
                                      background: 'linear-gradient(90deg, #10b981, #059669)',
                                      opacity: 0,
                                      transition: 'opacity 0.3s ease',
                                    }
                                  }}
                                  onClick={() => navigateToFolder(item.folder_id, item.file_type)}
                                >
                                  <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    {/* Selection Checkbox */}
                                    <Box position="absolute" top={8} right={8}>
                                      <Checkbox
                                        checked={selectedFiles.has(item.folder_id)}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          toggleFileSelection(item.folder_id);
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                        }}
                                        sx={{
                                          color: '#10b981',
                                          '&.Mui-checked': {
                                            color: '#10b981',
                                          }
                                        }}
                                      />
                                    </Box>

                                    <Box 
                                      display="flex" 
                                      justifyContent="center" 
                                      alignItems="center" 
                                      mb={1.5}
                                      sx={{ flexGrow: 1 }}
                                    >
                                      <Avatar
                                        sx={{
                                          width: 64,
                                          height: 64,
                                          background: isFolder 
                                            ? 'linear-gradient(135deg, #10b981, #059669)' 
                                            : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                          fontSize: '1.5rem',
                                        }}
                                      >
                                        {isFolder ? <FolderSharedIcon sx={{ fontSize: '2rem' }} /> : <DescriptionIcon sx={{ fontSize: '2rem' }} />}
                                      </Avatar>
                                    </Box>

                                    <Box textAlign="center">
                                      <Typography 
                                        variant="subtitle1" 
                                        sx={{ 
                                          fontWeight: 600,
                                          color: '#2d3748',
                                          mb: 0.5,
                                          wordBreak: 'break-word',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                          fontSize: '0.9rem',
                                        }}
                                      >
                                        {item.name}
                                      </Typography>
                                      <Chip
                                        label={isFolder ? 'Shared Folder' : 'Shared File'}
                                        size="small"
                                        sx={{
                                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                          color: '#10b981',
                                          fontWeight: 600,
                                          fontSize: '0.75rem',
                                        }}
                                      />
                                    </Box>
                                  </CardContent>
                                </Card>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Paper>
                </Fade>
              ))
            )}
          </Box>
        </Fade>
      )}
    </Container>
  );
};

export default SharedWithMe;

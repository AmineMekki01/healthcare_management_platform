import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Fade,
  Avatar,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Share as ShareIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { fileIconMapper } from './Helpers'; 
import axios from "./../axiosConfig";

function ISharedWith() {
  const { userId } = useContext(AuthContext);
  const [sharedItems, setSharedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const getSharedWith = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/v1/shared-by-me?userId=${userId}`);
      console.log('response:', response);
      setSharedItems(response.data.items || []);
    } catch (error) {
      console.error('Error retrieving shared with me docs:', error);
      setSharedItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSharedWith();
  }, [userId]);

  const viewFolder = (item) => {
    setSharedItems(item.id); 
  };

  // Group files by the user they were shared with
  const groupFilesByUser = () => {
    if (!sharedItems || !Array.isArray(sharedItems)) return {};
    
    const grouped = {};
    sharedItems.forEach(item => {
      const userId = item.shared_with_id || 'unknown';
      const userName = item.shared_with_name || 'Unknown User';
      const userType = item.shared_with_type || 'unknown';
      
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

  // Filter groups based on search term
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
        // Check if any files in this group match the search term
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
      {/* Search Bar */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mb: 3,
          borderRadius: '12px',
          background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
          border: '1px solid rgba(139, 92, 246, 0.1)',
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
                <SearchIcon sx={{ color: '#8b5cf6' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: 'white',
              '& fieldset': {
                borderColor: 'rgba(139, 92, 246, 0.2)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(139, 92, 246, 0.4)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#8b5cf6',
              },
            },
          }}
        />
      </Paper>

      {/* Grouped Files Display */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={60} sx={{ color: '#8b5cf6' }} />
        </Box>
      ) : (
        <Fade in timeout={1000}>
          <Box>
            {Object.keys(getFilteredGroups()).length === 0 ? (
              /* Empty State */
              <Box 
                textAlign="center" 
                py={8}
                sx={{
                  background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
                  borderRadius: '20px',
                  border: '2px dashed rgba(139, 92, 246, 0.3)',
                }}
              >
                <ShareIcon 
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
                  {searchTerm ? 'No Matching Files' : 'No Shared Items'}
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
                    : 'You haven\'t shared any files or folders yet. When you share medical documents with others, they will appear here.'
                  }
                </Typography>
              </Box>
            ) : (
              /* Grouped Files */
              Object.values(getFilteredGroups()).map((group, groupIndex) => (
                <Fade in timeout={1200 + groupIndex * 100} key={group.id}>
                  <Paper
                    elevation={2}
                    sx={{
                      mb: 3,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                      border: '1px solid rgba(139, 92, 246, 0.1)',
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
                        expandIcon={<ExpandMoreIcon sx={{ color: '#8b5cf6' }} />}
                        sx={{
                          backgroundColor: 'rgba(139, 92, 246, 0.05)',
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
                              backgroundColor: '#8b5cf6',
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
                                label={`${group.files.length} item${group.files.length !== 1 ? 's' : ''} shared`}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                  color: '#8b5cf6',
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
                              <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                                <Card
                                  sx={{
                                    height: '100%',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                                    border: '1px solid rgba(139, 92, 246, 0.1)',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&:hover': {
                                      transform: 'translateY(-4px) scale(1.02)',
                                      boxShadow: '0 8px 30px rgba(139, 92, 246, 0.15)',
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
                                      background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)',
                                      opacity: 0,
                                      transition: 'opacity 0.3s ease',
                                    }
                                  }}
                                  onClick={() => viewFolder(item)}
                                >
                                  <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    {/* File/Folder Icon */}
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
                                            ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' 
                                            : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                          fontSize: '1.5rem',
                                        }}
                                      >
                                        {isFolder ? <ShareIcon sx={{ fontSize: '2rem' }} /> : <DescriptionIcon sx={{ fontSize: '2rem' }} />}
                                      </Avatar>
                                    </Box>

                                    {/* File/Folder Name */}
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
                                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                          color: '#8b5cf6',
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
}
    

export default ISharedWith;


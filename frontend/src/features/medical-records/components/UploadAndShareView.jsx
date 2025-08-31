import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Paper
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Science as LabIcon,
  Visibility as RadiologyIcon,
  Assignment as ReportIcon,
  ExitToApp as DischargeIcon,
  AttachFile as AttachFileIcon

} from '@mui/icons-material';
import { AuthContext } from '../../auth/context/AuthContext';
import { fetchUsers, uploadClinicalDocument } from '../services/medicalRecordsService';

const MEDICAL_CATEGORIES = {
  'lab_results': { icon: <LabIcon />, label: 'Lab Results', color: '#4caf50', requiresBodyPart: false },
  'ct_scan': { icon: <RadiologyIcon />, label: 'CT Scan', color: '#2196f3', requiresBodyPart: true },
  'x_ray': { icon: <RadiologyIcon />, label: 'X-Ray', color: '#2196f3', requiresBodyPart: true },
  'ultrasound': { icon: <RadiologyIcon />, label: 'Ultrasound', color: '#2196f3', requiresBodyPart: true },
  'mammography': { icon: <RadiologyIcon />, label: 'Mammography', color: '#2196f3', requiresBodyPart: false },
  'mri': { icon: <RadiologyIcon />, label: 'MRI', color: '#2196f3', requiresBodyPart: true },
  'pet_scan': { icon: <RadiologyIcon />, label: 'PET Scan', color: '#2196f3', requiresBodyPart: true },
  'clinical_reports': { icon: <ReportIcon />, label: 'Clinical Reports', color: '#ff9800', requiresBodyPart: false },
  'discharge': { icon: <DischargeIcon />, label: 'Discharge', color: '#9c27b0', requiresBodyPart: false },
  'other': { icon: <FileIcon />, label: 'Other', color: '#607d8b', requiresBodyPart: false }
};

const BODY_PARTS = {
  'HEAD': 'Head',
  'NECK': 'Neck', 
  'CHEST': 'Chest',
  'ABDOMEN': 'Abdomen',
  'PELVIS': 'Pelvis',
  'SPINE': 'Spine',
  'ARM': 'Arm',
  'HAND': 'Hand',
  'LEG': 'Leg',
  'FOOT': 'Foot',
  'BRAIN': 'Brain',
  'HEART': 'Heart',
  'LUNGS': 'Lungs',
  'KIDNEY': 'Kidney',
  'LIVER': 'Liver',
  'KNEE': 'Knee',
  'SHOULDER': 'Shoulder',
  'HIP': 'Hip',
  'ANKLE': 'Ankle',
  'WRIST': 'Wrist',
  'FULL_BODY': 'Full Body',
  'OTHER': 'Other'
};


function UploadAndShareView() {
  const { userId, userType } = useContext(AuthContext);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [users, setUsers] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [createFolder, setCreateFolder] = useState(false);
  const [studyDate, setStudyDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadPatients = async () => {
      if (userType === 'doctor' || userType === 'receptionist') {
        try {
          const data = await fetchUsers();
          setUsers(data || []);
        } catch (err) {
          console.error('Failed to fetch patients:', err);
          setError('Failed to load patients');
        }
      }
    };
    
    loadPatients();
  }, [userType, userId]);


  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setSelectedFiles([...selectedFiles, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setSelectedFiles(selectedFiles.filter(f => f.id !== fileId));
  };

  const handleUpload = async () => {
    if (!selectedCategory || selectedFiles.length === 0) {
      setError('Please select category and files to upload');
      return;
    }

    if ((userType === 'doctor' || userType === 'receptionist') && !selectedUser) {
      setError('Please select a patient to share with');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      for (const fileData of selectedFiles) {
        await uploadClinicalDocument(
          fileData.file,
          selectedUser || userId,
          selectedCategory,
          userId,
          userType,
          generateFolderName()
        );
      }

      setSuccess(true);
      setSelectedFiles([]);
      setSelectedCategory('');
      setSelectedUser('');
      setFolderName('');
      setCreateFolder(false);
      
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generateFolderName = () => {
    if (!selectedCategory) return '';
    
    const currentUser = users.find(u => u.id === userId);
    const doctorName = currentUser?.name?.replace(/\s+/g, '') || 'Doctor';
    const categoryLabel = MEDICAL_CATEGORIES[selectedCategory]?.label || '';
    const bodyPartLabel = selectedBodyPart ? BODY_PARTS[selectedBodyPart] : '';
    
    let folderName = `Dr.${doctorName}_${studyDate}_${categoryLabel}`;
    if (bodyPartLabel && MEDICAL_CATEGORIES[selectedCategory]?.requiresBodyPart) {
      folderName += `_${bodyPartLabel}`;
    }
    
    return folderName;
  };

  useEffect(() => {
    console.log("selectedUser", selectedUser);
  }, [selectedUser]);
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#667eea' }}>
                Select Files
              </Typography>
              
              <input
                accept="*/*"
                style={{ display: 'none' }}
                id="file-upload"
                multiple
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  fullWidth
                  sx={{ 
                    mb: 3, 
                    py: 2,
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#5a67d8',
                      backgroundColor: '#667eea10'
                    }
                  }}
                >
                  Choose Files to Upload
                </Button>
              </label>

              {selectedFiles.length > 0 && (
                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <List dense>
                    {selectedFiles.map((file, index) => [
                      <ListItem key={file.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#667eea20' }}>
                            <AttachFileIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={file.file.name}
                          secondary={formatFileSize(file.file.size)}
                        />
                        <ListItemSecondaryAction>
                          <IconButton onClick={() => removeFile(file.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>,
                      index < selectedFiles.length - 1 && <Divider key={`divider-${file.id}`} />
                    ]).flat().filter(Boolean)}
                  </List>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#667eea' }}>
                Configuration
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Medical Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Medical Category"
                >
                  {Object.entries(MEDICAL_CATEGORIES).map(([key, category]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ color: category.color }}>
                          {category.icon}
                        </Box>
                        <Typography>{category.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedCategory && MEDICAL_CATEGORIES[selectedCategory]?.requiresBodyPart && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Body Part</InputLabel>
                  <Select
                    value={selectedBodyPart}
                    onChange={(e) => setSelectedBodyPart(e.target.value)}
                    label="Body Part"
                  >
                    {Object.entries(BODY_PARTS).map(([key, label]) => (
                      <MenuItem key={key} value={key}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                fullWidth
                type="date"
                label="Study Date"
                value={studyDate}
                onChange={(e) => setStudyDate(e.target.value)}
                sx={{ mb: 3 }}
                InputLabelProps={{
                  shrink: true,
                }}
              />

              {(userType === 'doctor' || userType === 'receptionist') && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Share with Patient</InputLabel>
                  <Select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    label="Share with Patient"
                  >
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body1">
                              {user.name} | {user.role}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {selectedCategory && (userType === 'doctor' || userType === 'receptionist') && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Auto-Generated Folder Name:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#495057' }}>
                    {generateFolderName()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Files will be organized in this folder for the patient
                  </Typography>
                </Box>
              )}

              {selectedCategory && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Selected Category:
                  </Typography>
                  <Chip
                    icon={MEDICAL_CATEGORIES[selectedCategory]?.icon}
                    label={MEDICAL_CATEGORIES[selectedCategory]?.label}
                    sx={{
                      bgcolor: `${MEDICAL_CATEGORIES[selectedCategory]?.color}15`,
                      color: MEDICAL_CATEGORIES[selectedCategory]?.color,
                      fontWeight: 600
                    }}
                  />
                </Box>
              )}

              <Button
                variant="contained"
                fullWidth
                onClick={handleUpload}
                disabled={loading || selectedFiles.length === 0 || !selectedCategory}
                startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
                sx={{
                  py: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6a4190 100%)',
                  },
                  '&:disabled': {
                    background: '#ccc'
                  }
                }}
              >
                {loading ? 'Uploading...' : 'Upload & Share Documents'}
              </Button>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Documents uploaded and shared successfully!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default UploadAndShareView;

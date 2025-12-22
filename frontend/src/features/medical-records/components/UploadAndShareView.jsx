import React, { useState, useEffect, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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

const getMedicalCategories = (t) => ({
  'lab_results': { icon: <LabIcon />, label: t('categories.labResults.label'), color: '#4caf50', requiresBodyPart: false },
  'ct_scan': { icon: <RadiologyIcon />, label: t('categories.ctScan.label'), color: '#2196f3', requiresBodyPart: true },
  'x_ray': { icon: <RadiologyIcon />, label: t('categories.xRay.label'), color: '#2196f3', requiresBodyPart: true },
  'ultrasound': { icon: <RadiologyIcon />, label: t('categories.ultrasound.label'), color: '#2196f3', requiresBodyPart: true },
  'mammography': { icon: <RadiologyIcon />, label: t('categories.mammography.label'), color: '#2196f3', requiresBodyPart: false },
  'mri': { icon: <RadiologyIcon />, label: t('categories.mri.label'), color: '#2196f3', requiresBodyPart: true },
  'pet_scan': { icon: <RadiologyIcon />, label: t('categories.petScan.label'), color: '#2196f3', requiresBodyPart: true },
  'clinical_reports': { icon: <ReportIcon />, label: t('categories.clinicalReports.label'), color: '#ff9800', requiresBodyPart: false },
  'discharge': { icon: <DischargeIcon />, label: t('categories.discharge.label'), color: '#9c27b0', requiresBodyPart: false },
  'other': { icon: <FileIcon />, label: t('categories.other.label'), color: '#607d8b', requiresBodyPart: false }
});

const getBodyParts = (t) => ({
  'HEAD': t('bodyParts.head'),
  'NECK': t('bodyParts.neck'), 
  'CHEST': t('bodyParts.chest'),
  'ABDOMEN': t('bodyParts.abdomen'),
  'PELVIS': t('bodyParts.pelvis'),
  'SPINE': t('bodyParts.spine'),
  'ARM': t('bodyParts.arm'),
  'HAND': t('bodyParts.hand'),
  'LEG': t('bodyParts.leg'),
  'FOOT': t('bodyParts.foot'),
  'BRAIN': t('bodyParts.brain'),
  'HEART': t('bodyParts.heart'),
  'LUNGS': t('bodyParts.lungs'),
  'KIDNEY': t('bodyParts.kidney'),
  'LIVER': t('bodyParts.liver'),
  'KNEE': t('bodyParts.knee'),
  'SHOULDER': t('bodyParts.shoulder'),
  'HIP': t('bodyParts.hip'),
  'ANKLE': t('bodyParts.ankle'),
  'WRIST': t('bodyParts.wrist'),
  'FULL_BODY': t('bodyParts.fullBody'),
  'OTHER': t('bodyParts.other')
});


function UploadAndShareView() {
  const { t} = useTranslation('medical');
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
          setError(t('errors.failedToLoadPatients'));
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
      setError(t('errors.selectCategoryAndFiles'));
      return;
    }

    if ((userType === 'doctor' || userType === 'receptionist') && !selectedUser) {
      setError(t('errors.selectPatientToShare'));
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
    const categoryLabel = getMedicalCategories(t)[selectedCategory]?.label || '';
    const bodyPartLabel = selectedBodyPart ? getBodyParts(t)[selectedBodyPart] : '';
    
    let folderName = `Dr.${doctorName}_${studyDate}_${categoryLabel}`;
    if (bodyPartLabel && getMedicalCategories(t)[selectedCategory]?.requiresBodyPart) {
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
                {t('uploadAndShare.selectFiles')}
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
                    gap: 1,
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#5a67d8',
                      backgroundColor: '#667eea10'
                    }
                  }}
                >
                  {t('uploadAndShare.chooseFiles')}
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
                {t('uploadAndShare.configuration')}
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>{t('uploadAndShare.medicalCategory')}</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label={t('uploadAndShare.medicalCategory')}
                >
                  {Object.entries(getMedicalCategories(t)).map(([key, category]) => (
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

              {selectedCategory && getMedicalCategories(t)[selectedCategory]?.requiresBodyPart && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>{t('uploadAndShare.bodyPart')}</InputLabel>
                  <Select
                    value={selectedBodyPart}
                    onChange={(e) => setSelectedBodyPart(e.target.value)}
                    label={t('uploadAndShare.bodyPart')}
                  >
                    {Object.entries(getBodyParts(t)).map(([key, label]) => (
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
                label={t('uploadAndShare.studyDate')}
                value={studyDate}
                onChange={(e) => setStudyDate(e.target.value)}
                sx={{ mb: 3 }}
                InputLabelProps={{
                  shrink: true,
                }}
              />

              {(userType === 'doctor' || userType === 'receptionist') && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>{t('uploadAndShare.shareWithPatient')}</InputLabel>
                  <Select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    label={t('uploadAndShare.shareWithPatient')}
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
                    {t('uploadAndShare.autoGeneratedFolder')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#495057' }}>
                    {generateFolderName()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {t('uploadAndShare.folderDescription')}
                  </Typography>
                </Box>
              )}

              {selectedCategory && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('uploadAndShare.selectedCategory')}
                  </Typography>
                  <Chip
                    icon={getMedicalCategories(t)[selectedCategory]?.icon}
                    label={getMedicalCategories(t)[selectedCategory]?.label}
                    sx={{
                      bgcolor: `${getMedicalCategories(t)[selectedCategory]?.color}15`,
                      color: getMedicalCategories(t)[selectedCategory]?.color,
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
                  gap: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6a4190 100%)',
                  },
                  '&:disabled': {
                    background: '#ccc'
                  }
                }}
              >
                {loading ? t('uploadAndShare.uploading') : t('uploadAndShare.uploadAndShareButton')}
              </Button>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {t('uploadAndShare.successMessage')}
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

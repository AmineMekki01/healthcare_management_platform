import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  Divider,
  Container,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar
} from '@mui/material';
import {
  Description as FileIcon,
  Download as DownloadIcon,
  Science as LabIcon,
  Visibility as RadiologyIcon,
  Assignment as ReportIcon,
  ExitToApp as DischargeIcon,
  Folder as FolderIcon,
  CalendarToday as DateIcon
} from '@mui/icons-material';
import { AuthContext } from '../../auth/context/AuthContext';
import { getMedicalRecordsByCategory, downloadFile, downloadMultipleFiles } from '../services/medicalRecordsService';

const getMedicalCategories = (t) => ({
  'lab_results': { 
    icon: <LabIcon />, 
    label: t('categories.labResults.label'), 
    color: '#4caf50',
    description: t('categories.labResults.description')
  },
  'ct_scan': { 
    icon: <RadiologyIcon />, 
    label: t('categories.ctScan.label'), 
    color: '#2196f3',
    description: t('categories.ctScan.description')
  },
  'x_ray': { 
    icon: <RadiologyIcon />, 
    label: t('categories.xRay.label'), 
    color: '#2196f3',
    description: t('categories.xRay.description')
  },
  'ultrasound': { 
    icon: <RadiologyIcon />, 
    label: t('categories.ultrasound.label'), 
    color: '#2196f3',
    description: t('categories.ultrasound.description')
  },
  'mri': { 
    icon: <RadiologyIcon />, 
    label: t('categories.mri.label'), 
    color: '#2196f3',
    description: t('categories.mri.description')
  },
  'clinical_reports': { 
    icon: <ReportIcon />, 
    label: t('categories.clinicalReports.label'), 
    color: '#ff9800',
    description: t('categories.clinicalReports.description')
  },
  'discharge': { 
    icon: <DischargeIcon />, 
    label: t('categories.discharge.label'), 
    color: '#9c27b0',
    description: t('categories.discharge.description')
  },
  'other': { 
    icon: <FileIcon />, 
    label: t('categories.other.label'), 
    color: '#607d8b',
    description: t('categories.other.description')
  }
});

function MedicalRecordsView({ onBackToMyDocs }) {
  const { t, i18n } = useTranslation('medical');
  const isRTL = i18n.language === 'ar';

  const { userId } = useContext(AuthContext);
  const [medicalRecords, setMedicalRecords] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryDocuments, setCategoryDocuments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  console.log(categoryDocuments);
  const MEDICAL_CATEGORIES = getMedicalCategories(t);

  const extractFolderInfo = useCallback((doc) => {
    const path = doc.path || '';
    const pathParts = path.split('/');
    
    const folderPattern = /Dr\.([^_]+)_(\d{4}-\d{2}-\d{2})_([^_]+)(?:_(.+))?/;
    
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const part = pathParts[i];
      const match = part.match(folderPattern);
      if (match) {
        return {
          folderName: part,
          doctorName: match[1],
          studyDate: match[2],
          category: match[3],
          bodyPart: match[4] || null
        };
      }
    }
    
    const doctorName = doc.doctor_name || doc.uploader_name || 'Doctor';
    const studyDate = doc.study_date || doc.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
    const category = MEDICAL_CATEGORIES[doc.category]?.label || 'Other';
    const bodyPart = doc.body_part;
    
    let folderName = `Dr.${doctorName.replace(/\s+/g, '')}_${studyDate}_${category}`;
    if (bodyPart && bodyPart !== 'OTHER') {
      folderName += `_${bodyPart}`;
    }
    
    return {
      folderName,
      doctorName,
      studyDate,
      category,
      bodyPart
    };
  }, [MEDICAL_CATEGORIES]);

  const fetchMedicalRecords = useCallback(async () => {
    if (!userId) return;
    
    try {
      const data = await getMedicalRecordsByCategory(userId, 'patient');
      
      const groupedRecords = {};
      data?.forEach(doc => {
        const category = doc.category || 'other';
        if (!groupedRecords[category]) {
          groupedRecords[category] = [];
        }
        
        const folderInfo = extractFolderInfo(doc);
        doc.folderInfo = folderInfo;
        
        groupedRecords[category].push(doc);
      });
      
      Object.keys(groupedRecords).forEach(category => {
        const folderGroups = {};
        groupedRecords[category].forEach(doc => {
          const folderName = doc.folderInfo?.folderName || 'Ungrouped';
          if (!folderGroups[folderName]) {
            folderGroups[folderName] = {
              folderName,
              doctorName: doc.folderInfo?.doctorName,
              studyDate: doc.folderInfo?.studyDate,
              bodyPart: doc.folderInfo?.bodyPart,
              files: []
            };
          }
          folderGroups[folderName].files.push(doc);
        });
        groupedRecords[category] = Object.values(folderGroups);
      });
      
      setMedicalRecords(groupedRecords);
    } catch (error) {
      console.error('Error fetching medical records:', error);
    }
  }, [userId, extractFolderInfo]);

  useEffect(() => {
    fetchMedicalRecords();
  }, [fetchMedicalRecords]);

  const handleCategoryClick = (categoryKey) => {
    setSelectedCategory(categoryKey);
    setCategoryDocuments(medicalRecords[categoryKey] || []);
    setDialogOpen(true);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  const handleDownload = async (documentId, filename) => {
    try {
      const blob = await downloadFile(documentId);
      
      if (blob.size === 0) {
        console.error('Downloaded file is empty');
        alert('Downloaded file is empty');
        return;
      }
      
      let finalFilename = filename || `document_${documentId}`;
      if (!finalFilename.includes('.')) {
        finalFilename = `${finalFilename}.bin`;
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      alert(`Download error: ${error.message}`);
    }
  };

  const handleFolderDownload = async (folderGroup) => {
    try {
      const fileIds = folderGroup.files.map(file => file.folder_id || file.id);
      
      const blob = await downloadMultipleFiles(fileIds, folderGroup.folderName);
      
      if (blob.size === 0) {
        alert('Downloaded folder is empty');
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderGroup.folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading folder:', error);
      alert(`Folder download error: ${error.message}`);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {Object.entries(MEDICAL_CATEGORIES).map(([categoryKey, category]) => {
          const documentsCount = medicalRecords[categoryKey]?.length || 0;
          const hasDocuments = documentsCount > 0;
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={categoryKey}>
              <Card 
                sx={{
                  height: '100%',
                  cursor: hasDocuments ? 'pointer' : 'default',
                  opacity: hasDocuments ? 1 : 0.6,
                  transition: 'all 0.3s ease',
                  border: `2px solid ${category.color}20`,
                  '&:hover': hasDocuments ? {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${category.color}30`,
                    borderColor: `${category.color}60`
                  } : {}
                }}
                onClick={() => hasDocuments && handleCategoryClick(categoryKey)}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box 
                    sx={{ 
                      color: category.color, 
                      mb: 2,
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    {React.cloneElement(category.icon, { sx: { fontSize: 48 } })}
                  </Box>
                  
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1,
                      color: category.color
                    }}
                  >
                    {category.label}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 2, minHeight: 40 }}
                  >
                    {category.description}
                  </Typography>
                  
                  <Chip
                    label={t('labels.documentCount', { count: documentsCount })}
                    sx={{
                      bgcolor: hasDocuments ? `${category.color}15` : '#f5f5f5',
                      color: hasDocuments ? category.color : '#999',
                      fontWeight: 600
                    }}
                  />
                </CardContent>
                
                {hasDocuments && (
                  <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button
                      size="small"
                      sx={{ 
                        color: category.color,
                        fontWeight: 600,
                        textTransform: 'none'
                      }}
                    >
                      {t('labels.viewDocuments')}
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          bgcolor: selectedCategory ? `${MEDICAL_CATEGORIES[selectedCategory]?.color}10` : 'transparent'
        }}>
          {selectedCategory && (
            <>
              <Box sx={{ color: MEDICAL_CATEGORIES[selectedCategory]?.color }}>
                {MEDICAL_CATEGORIES[selectedCategory]?.icon}
              </Box>
              <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                {MEDICAL_CATEGORIES[selectedCategory]?.label}
              </Typography>
            </>
          )}
        </DialogTitle>
        
        <DialogContent>
          {categoryDocuments.map((folderGroup, folderIndex) => (
            <Box key={folderGroup.folderName || folderIndex} sx={{ mb: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 2, 
                p: 2, 
                bgcolor: `${MEDICAL_CATEGORIES[selectedCategory]?.color}10`,
                borderRadius: 2,
                border: `1px solid ${MEDICAL_CATEGORIES[selectedCategory]?.color}30`
              }}>
                <FolderIcon sx={{ color: MEDICAL_CATEGORIES[selectedCategory]?.color }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: MEDICAL_CATEGORIES[selectedCategory]?.color }}>
                    {folderGroup.folderName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Dr. {folderGroup.doctorName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      •
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(folderGroup.studyDate).toLocaleDateString()}
                    </Typography>
                    {folderGroup.bodyPart && (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          •
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {folderGroup.bodyPart}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label={t('labels.fileCount', { count: folderGroup.files.length })}
                    size="small"
                    sx={{ 
                      bgcolor: `${MEDICAL_CATEGORIES[selectedCategory]?.color}20`,
                      color: MEDICAL_CATEGORIES[selectedCategory]?.color 
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleFolderDownload(folderGroup)}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      width: 28,
                      height: 28,
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    }}
                    title={t('labels.downloadFolder')}
                  >
                    <DownloadIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              </Box>

              <List sx={{ pl: 2 }}>
                {folderGroup.files.map((doc, fileIndex) => [
                  <ListItem key={doc.id || fileIndex} sx={{ 
                    py: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <ListItemAvatar sx={{ 
                        minWidth: 'auto',
                       
                      }}>
                        <Avatar sx={{
                          bgcolor: `${MEDICAL_CATEGORIES[selectedCategory]?.color}20`, 
                          width: 32, 
                          height: 32,
                          ml: isRTL ? 2 : 0,
                          mr: isRTL ? 0 : 2
                        }}>
                          <FileIcon sx={{ color: MEDICAL_CATEGORIES[selectedCategory]?.color, fontSize: 16 }} />
                        </Avatar>
                      </ListItemAvatar>
                      
                      <Box sx={{ 
                        flex: 1,
                      }}>
                        <Typography variant="body1" sx={{
                          fontWeight: 500,
                          display: 'block',
                          mb: 0.5
                        }}>
                          {doc.name || 'Untitled Document'}
                        </Typography>
                        
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          justifyContent: isRTL ? 'flex-end' : 'flex-start'
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            color: 'text.secondary'
                          }}>
                            <DateIcon sx={{ fontSize: 12 }} />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                          {doc.size && (
                            <>
                              <Typography variant="caption" color="text.secondary">•</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatFileSize(doc.size)}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box>
                      <IconButton 
                        onClick={() => handleDownload(doc.folder_id, doc.name)}
                        size="small"
                        sx={{ 
                          bgcolor: 'primary.main',
                          color: 'white',
                          width: 32,
                          height: 32,
                          '&:hover': {
                            bgcolor: 'primary.dark'
                          }
                        }}
                      >
                        <DownloadIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </ListItem>,
                  fileIndex < folderGroup.files.length - 1 && (
                    <Divider 
                      key={`file-divider-${doc.id || fileIndex}`} 
                      sx={isRTL ? { mr: 6 } : { ml: 6 }} 
                    />
                  )
                ]).flat().filter(Boolean)}
              </List>
            </Box>
          ))}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {t('labels.close')}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}

export default MedicalRecordsView;

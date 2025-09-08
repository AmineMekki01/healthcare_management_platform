import React, { useContext, useState } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../auth/context/AuthContext";
import { ReportCard, ReportFilters } from "../components";
import { useReportsManagement } from "../hooks";
import { generateReportStats } from "../utils";
import {
  Container,
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
} from "@mui/icons-material";

export default function MyReportsPage() {
  const { t } = useTranslation('reports');
  const { userId } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const {
    reports,
    allReports,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    deleteReport: deleteReportFromService,
    refreshReports,
    setError
  } = useReportsManagement(userId);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    updateFilters({ [name]: value });
  };

  const handleSearch = () => {
    refreshReports();
  };

  const handleReportClick = (reportId) => {
    navigate(`/doctor-report/${reportId}`);
  };

  const handleEditReport = (event, reportId) => {
    event.stopPropagation();
    navigate(`/edit-medical-report/${reportId}`);
  };

  const handleDeleteReport = async (event, reportId) => {
    event.stopPropagation();
    
    if (window.confirm(t('confirmations.deleteReport'))) {
      setDeleteLoading(true);
      try {
        const success = await deleteReportFromService(reportId);
        if (success) {
          alert(t('messages.deleteSuccess'));
        }
      } catch (error) {
        console.error('Error deleting report:', error);
        alert(t('messages.deleteError'));
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Box 
          display="flex" 
          alignItems="center" 
          mb={2}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            p: 3,
            color: 'white',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
          }}
        >
          <AssignmentIcon sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                mb: 0.5,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              {t('pages.myReports.title')}
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                opacity: 0.9,
                fontWeight: 400 
              }}
            >
              {t('pages.myReports.subtitle')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={50} />
        </Box>
      )}

      {!loading && (
        <ReportFilters
          filterCriteria={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          loading={loading}
        />
      )}

      {!loading && (
        <Grid container spacing={3}>
          {reports.map((report, index) => (
            <Grid item xs={12} sm={6} lg={4} key={report.report_id || index}>
              <ReportCard
                report={report}
                onView={handleReportClick}
                onEdit={handleEditReport}
                onDelete={handleDeleteReport}
                deleteLoading={deleteLoading}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && reports.length === 0 && !error && (
        <Box 
          textAlign="center" 
          py={8}
          sx={{
            background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
            borderRadius: '20px',
            border: '2px dashed rgba(102, 126, 234, 0.3)',
          }}
        >
          <AssignmentIcon 
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
            {t('pages.myReports.noReportsTitle')}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#94a3b8',
              maxWidth: 400,
              mx: 'auto'
            }}
          >
            {t('pages.myReports.noReportsMessage')}
          </Typography>
        </Box>
      )}
    </Container>
  );
}

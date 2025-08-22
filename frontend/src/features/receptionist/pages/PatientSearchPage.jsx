import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Avatar,
  Grid,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

import receptionistPatientService from '../services/receptionistPatientService';

const PatientSearchPage = () => {
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(12);
  const [assignedDoctorId, setAssignedDoctorId] = useState(null);

  useEffect(() => {
    const doctorId = localStorage.getItem('assignedDoctorId');
    if (doctorId) {
      setAssignedDoctorId(doctorId);
    } else {
      setError('No assigned doctor found. Please contact administrator.');
    }
  }, []);

  useEffect(() => {
    if (assignedDoctorId) {
      searchPatients();
    }
  }, [assignedDoctorId, currentPage, statusFilter]);

  const searchPatients = async () => {
    if (!assignedDoctorId) {
      setError('No assigned doctor found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = {
        search_term: searchQuery,
        status: statusFilter !== 'all' ? statusFilter : '',
        page: currentPage,
        page_size: limit
      };

      const response = await receptionistPatientService.searchPatients(params);
      setPatients(response.data.patients || []);
      setTotalCount(response.data.total || 0);
    } catch (error) {
      console.error('Error searching patients:', error);
      setError(error.response?.data?.error || 'Failed to search patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    searchPatients();
  };

  const handleViewPatient = (patientId) => {
    navigate(`/receptionist/patients/${patientId}`);
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const getStatusColor = (hasActiveAppointments) => {
    return hasActiveAppointments ? 'success' : 'default';
  };

  const getStatusLabel = (hasActiveAppointments) => {
    return hasActiveAppointments ? 'Active' : 'Inactive';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Patient Search
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search and manage patients with appointments
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={handleSearch}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search by patient name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Patients</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ height: '56px' }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Search'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && patients.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, totalCount)} of {totalCount} patients
          </Typography>
        </Box>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : patients.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {patients.map((patient) => (
              <Grid item xs={12} sm={6} md={4} key={patient.patientId}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    }
                  }}
                  onClick={() => handleViewPatient(patient.patientId)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar
                        src={patient.profile_picture_url}
                        sx={{ width: 60, height: 60, mr: 2 }}
                      >
                        <PersonIcon />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="h6" component="h3">
                          {patient.firstName} {patient.lastName}
                        </Typography>
                        <Chip
                          label={getStatusLabel(patient.hasActiveAppointments)}
                          color={getStatusColor(patient.hasActiveAppointments)}
                          size="small"
                        />
                      </Box>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPatient(patient.patientId);
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {patient.email}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {patient.phoneNumber}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Last visit: {formatDate(patient.lastAppointmentDate)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Age: {patient.age} • {patient.sex}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="caption" color="text.secondary" display="block">
                          Total: {patient.totalAppointments}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Completed: {patient.completedAppointments}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      ) : (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No patients found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery 
                  ? 'Try adjusting your search criteria' 
                  : 'No patients have appointments with the assigned doctor'
                }
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default PatientSearchPage;

import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../components/Auth/AuthContext";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Container,
  Paper,
  Box,
  IconButton,
  Chip,
  Fade,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Person as PersonIcon,
  LocalHospital as LocalHospitalIcon,
  Event as EventIcon,
  ArrowForward as ArrowForwardIcon,
  FilterList as FilterListIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import axios from "./../components/axiosConfig";

export default function DoctorReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    patientName: "",
    diagnosisName: "",
    referralDoctor: "",
    year: "",
    month: "",
    day: "",
  });
  const { userId } = useContext(AuthContext);
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // Months are 0-based
  const currentDay = new Date().getDate();

  const years = [];
  for (let y = 2020; y <= currentYear; y++) {
    years.push(y);
  }

  const getMonths = () => {
    if (!filterCriteria.year) {
      return [];
    }
    const selectedYear = parseInt(filterCriteria.year, 10);
    const months = [];
    const maxMonth = selectedYear === currentYear ? currentMonth : 12;
    for (let m = 1; m <= maxMonth; m++) {
      months.push(m);
    }
    return months;
  };

  const getDays = () => {
    if (!filterCriteria.year || !filterCriteria.month) {
      return [];
    }
    const selectedYear = parseInt(filterCriteria.year, 10);
    const selectedMonth = parseInt(filterCriteria.month, 10);
    let daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    // If the selected year and month are the current year and month, limit days up to current day
    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      daysInMonth = currentDay;
    }

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  };

  const getReports = async () => {
    setLoading(true);
    try {
      const params = {
        year: filterCriteria.year,
        month: filterCriteria.month,
        day: filterCriteria.day,
        patientName: filterCriteria.patientName,
        diagnosisName: filterCriteria.diagnosisName,
        referralDoctor: filterCriteria.referralDoctor,
      };
      const response = await axios.get(`/api/v1/reports/${userId}`, { params });
      
      // Ensure we always have an array, even if the response is null or undefined
      const reportsData = response.data || [];
      
      // Sort the reports if there are any
      const sortedReports = Array.isArray(reportsData) 
        ? reportsData.sort((a, b) => new Date(b.creation_date) - new Date(a.creation_date))
        : [];
      
      setReports(sortedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      // Clear reports on error to avoid showing stale data
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterCriteria((prev) => {
      const updatedCriteria = { ...prev, [name]: value };
      // Reset month and day if year changes
      if (name === "year") {
        updatedCriteria.month = "";
        updatedCriteria.day = "";
      }
      // Reset day if month changes
      if (name === "month") {
        updatedCriteria.day = "";
      }
      return updatedCriteria;
    });
    
    // Clear current reports when filter changes to give immediate feedback
    // Users will need to click Search to see new results
    setReports([]);
  };

  const handleSearch = () => {
    // Trigger the report fetch with the current filter criteria when "Search" is clicked
    getReports();
  };

  const handleReportClick = (reportId) => {
    navigate(`/doctor-report/${reportId}`);
  };

  // Load reports when component mounts
  useEffect(() => {
    if (userId) {
      getReports();
    }
  }, [userId]);

  // Clear reports when filter criteria changes (except for the search button)
  const clearReportsOnFilterChange = () => {
    setReports([]);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
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
              Medical Reports
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                opacity: 0.9,
                fontWeight: 400 
              }}
            >
              Manage and review your patient reports
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Filter Section */}
      <Fade in timeout={800}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 4,
            borderRadius: '20px',
            background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
            border: '1px solid rgba(102, 126, 234, 0.1)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Box display="flex" alignItems="center" mb={3}>
            <FilterListIcon sx={{ 
              color: '#667eea', 
              mr: 1,
              fontSize: 28 
            }} />
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600,
                color: '#2d3748',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Filter Reports
            </Typography>
          </Box>
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl 
                fullWidth 
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                    },
                    '&.Mui-focused': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    }
                  }
                }}
              >
                <InputLabel id="year-label">Year</InputLabel>
                <Select
                  labelId="year-label"
                  label="Year"
                  name="year"
                  value={filterCriteria.year}
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">
                    <em>Any Year</em>
                  </MenuItem>
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl
                fullWidth
                variant="outlined"
                disabled={!filterCriteria.year}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    '&:hover:not(.Mui-disabled)': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                    },
                    '&.Mui-focused': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    }
                  }
                }}
              >
                <InputLabel id="month-label">Month</InputLabel>
                <Select
                  labelId="month-label"
                  label="Month"
                  name="month"
                  value={filterCriteria.month}
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">
                    <em>Any Month</em>
                  </MenuItem>
                  {getMonths().map((month) => (
                    <MenuItem key={month} value={month}>
                      {new Date(0, month - 1).toLocaleString("default", {
                        month: "long",
                      })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl
                fullWidth
                variant="outlined"
                disabled={!filterCriteria.year || !filterCriteria.month}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    '&:hover:not(.Mui-disabled)': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                    },
                    '&.Mui-focused': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    }
                  }
                }}
              >
                <InputLabel id="day-label">Day</InputLabel>
                <Select
                  labelId="day-label"
                  label="Day"
                  name="day"
                  value={filterCriteria.day}
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">
                    <em>Any Day</em>
                  </MenuItem>
                  {getDays().map((day) => (
                    <MenuItem key={day} value={day}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Patient Name"
                variant="outlined"
                fullWidth
                name="patientName"
                value={filterCriteria.patientName}
                onChange={handleFilterChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                    },
                    '&.Mui-focused': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Diagnosis"
                variant="outlined"
                fullWidth
                name="diagnosisName"
                value={filterCriteria.diagnosisName}
                onChange={handleFilterChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                    },
                    '&.Mui-focused': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Referral Doctor"
                variant="outlined"
                fullWidth
                name="referralDoctor"
                value={filterCriteria.referralDoctor}
                onChange={handleFilterChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                    },
                    '&.Mui-focused': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleSearch}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                disabled={loading}
                size="large"
                sx={{
                  mt: 2,
                  py: 1.5,
                  px: 4,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  '&:hover:not(:disabled)': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                    boxShadow: '0 6px 25px rgba(102, 126, 234, 0.5)',
                    transform: 'translateY(-2px)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #94a3b8, #64748b)',
                    color: 'white',
                  }
                }}
              >
                {loading ? 'Searching...' : 'Search Reports'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      {/* Reports Grid */}
      <Fade in timeout={1000}>
        <Grid container spacing={3}>
          {reports.map((report, index) => (
            <Grid item xs={12} sm={6} lg={4} key={report.report_id}>
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
                      '& .report-arrow': {
                        transform: 'translateX(5px)',
                        color: '#667eea',
                      },
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
                  onClick={() => handleReportClick(report.report_id)}
                >
                  <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Patient Info */}
                    <Box display="flex" alignItems="center" mb={2}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          color: 'white',
                          mr: 2,
                        }}
                      >
                        <PersonIcon />
                      </Box>
                      <Box flexGrow={1}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700,
                            color: '#2d3748',
                            mb: 0.5
                          }}
                        >
                          {report.patient_first_name} {report.patient_last_name}
                        </Typography>
                        <Chip 
                          label="Patient"
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            color: '#667eea',
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Diagnosis */}
                    <Box display="flex" alignItems="start" mb={2}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: '12px',
                          backgroundColor: 'rgba(244, 63, 94, 0.1)',
                          color: '#f43f5e',
                          mr: 2,
                        }}
                      >
                        <LocalHospitalIcon />
                      </Box>
                      <Box flexGrow={1}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#64748b',
                            fontWeight: 600,
                            mb: 0.5
                          }}
                        >
                          Diagnosis
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: '#2d3748',
                            fontWeight: 500
                          }}
                        >
                          {report.diagnosis_name}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Referral Doctor */}
                    {report.referral_doctor_name && (
                      <Box display="flex" alignItems="start" mb={2}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: '12px',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            mr: 2,
                          }}
                        >
                          <PersonIcon />
                        </Box>
                        <Box flexGrow={1}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#64748b',
                              fontWeight: 600,
                              mb: 0.5
                            }}
                          >
                            Referred to
                          </Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              color: '#2d3748',
                              fontWeight: 500
                            }}
                          >
                            Dr. {report.referral_doctor_name}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Date */}
                    <Box display="flex" alignItems="center" mt="auto">
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: '12px',
                          backgroundColor: 'rgba(168, 85, 247, 0.1)',
                          color: '#a855f7',
                          mr: 2,
                        }}
                      >
                        <EventIcon />
                      </Box>
                      <Box flexGrow={1}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#64748b',
                            fontWeight: 600,
                            mb: 0.5
                          }}
                        >
                          Created
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: '#2d3748',
                            fontWeight: 500
                          }}
                        >
                          {new Date(report.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                      <Tooltip title="View Report" arrow>
                        <IconButton
                          className="report-arrow"
                          sx={{
                            color: '#94a3b8',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <ArrowForwardIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Fade>

      {/* No Reports Message */}
      {reports.length === 0 && (
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
              No Reports Found
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#94a3b8',
                maxWidth: 400,
                mx: 'auto'
              }}
            >
              Try adjusting your search criteria or create a new report to get started.
            </Typography>
          </Box>
        </Fade>
      )}
    </Container>
  );
}

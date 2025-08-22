import React from 'react';
import {
  Paper,
  Typography,
  TextField,
  Grid,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';

export default function ReportFilters({ 
  filterCriteria, 
  onFilterChange, 
  onSearch, 
  loading = false 
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentDay = new Date().getDate();

  const years = [];
  for (let y = 2020; y <= currentYear; y++) {
    years.push(y);
  }

  const getMonths = () => {
    if (!filterCriteria.year) return [];
    const selectedYear = parseInt(filterCriteria.year, 10);
    const months = [];
    const maxMonth = selectedYear === currentYear ? currentMonth : 12;
    for (let m = 1; m <= maxMonth; m++) {
      months.push(m);
    }
    return months;
  };

  const getDays = () => {
    if (!filterCriteria.year || !filterCriteria.month) return [];
    const selectedYear = parseInt(filterCriteria.year, 10);
    const selectedMonth = parseInt(filterCriteria.month, 10);
    let daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      daysInMonth = currentDay;
    }

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  };

  return (
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
              onChange={onFilterChange}
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
              onChange={onFilterChange}
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
              onChange={onFilterChange}
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
            onChange={onFilterChange}
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
            onChange={onFilterChange}
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
            onChange={onFilterChange}
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
            onClick={onSearch}
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
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocalHospital as LocalHospitalIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import axios from './axiosConfig';

const DoctorAutocomplete = ({
  value = '',
  onChange,
  specialty = '',
  label = 'Referred Doctor Name',
  placeholder = 'Search for a doctor or enter manually',
  disabled = false,
  required = false,
  error = false,
  helperText = '',
  ...props
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '');
    }
  }, [value]);

  const searchDoctors = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      const params = {
        q: searchQuery.trim(),
        limit: 10,
      };
      
      if (specialty && specialty.trim()) {
        params.specialty = specialty.trim();
      }

      console.log('Searching doctors with params:', params);
      const response = await axios.get('/api/v1/doctors-referral-search', { params });
      const doctors = response.data || [];
      
      console.log('Received doctors:', doctors.length, 'results');
      
      const transformedDoctors = doctors.map(doctor => ({
        ...doctor,
        fullName: doctor.fullName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()
      }));
      
      setOptions(transformedDoctors);
    } catch (error) {
      console.error('Error searching doctors:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (inputValue && inputValue.length >= 2 && inputValue.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchDoctors(inputValue);
      }, 500);
    } else {
      setOptions([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [inputValue, specialty]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (event, newInputValue, reason) => {
    setInputValue(newInputValue || '');
    
    if (reason === 'input' || reason === 'clear') {
      onChange(newInputValue || '');
    }
  };

  const handleChange = (event, newValue, reason) => {
    if (newValue && typeof newValue === 'object') {
      const fullName = newValue.fullName || '';
      setInputValue(fullName);
      onChange(fullName);
      setOpen(false);
    } else if (typeof newValue === 'string') {
      setInputValue(newValue);
      onChange(newValue);
    } else if (newValue === null) {
      setInputValue('');
      onChange('');
    }
  };

  return (
    <Autocomplete
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      options={options}
      loading={loading}
      freeSolo
      clearOnBlur={false}
      selectOnFocus={true}
      handleHomeEndKeys={true}
      value={inputValue}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleChange}
      disabled={disabled}
      filterOptions={(options) => options}
      getOptionLabel={(option) => {
        if (typeof option === 'string') {
          return option;
        }
        return option.fullName || `${option.firstName || ''} ${option.lastName || ''}`.trim();
      }}
      isOptionEqualToValue={(option, value) => {
        if (typeof option === 'string' && typeof value === 'string') {
          return option.toLowerCase() === value.toLowerCase();
        }
        if (typeof option === 'object' && typeof value === 'string') {
          const fullName = option.fullName || `${option.firstName || ''} ${option.lastName || ''}`.trim();
          return fullName.toLowerCase() === value.toLowerCase();
        }
        return false;
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          {...props}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" width="100%">
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 40,
                height: 40,
                mr: 2,
              }}
            >
              <PersonIcon />
            </Avatar>
            <Box flexGrow={1}>
              <Typography variant="subtitle1" fontWeight={600}>
                {option.fullName}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <Chip
                  icon={<LocalHospitalIcon />}
                  label={option.specialty}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
                {option.experience && (
                  <Typography variant="caption" color="text.secondary">
                    {option.experience} years exp.
                  </Typography>
                )}
                {option.rating_score > 0 && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <StarIcon sx={{ fontSize: 14, color: '#ffc107' }} />
                    <Typography variant="caption" color="text.secondary">
                      {option.rating_score.toFixed(1)} ({option.rating_count})
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            variant="outlined"
            label={typeof option === 'string' ? option : option.fullName}
            {...getTagProps({ index })}
            key={index}
          />
        ))
      }
      noOptionsText={
        inputValue.length < 2 
          ? "Type at least 2 characters to search"
          : loading 
          ? "Searching..."
          : "No doctors found. You can enter a name manually."
      }
      loadingText="Searching doctors..."
    />
  );
};

export default DoctorAutocomplete;

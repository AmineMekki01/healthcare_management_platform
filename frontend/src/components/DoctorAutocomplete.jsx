import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
import { getLocalizedSpecialtyLabel, normalizeSpecialtyCode } from '../utils/specialties';

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
  const { i18n } = useTranslation();
  const { t: tMedical } = useTranslation('medical');
  const { t: tSearch } = useTranslation('search');

  const isArabic = (i18n.language || '').startsWith('ar');

  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [open, setOpen] = useState(false);
  const searchTimeoutRef = useRef(null);

  const getDoctorName = (doctor) => {
    if (!doctor) return '';

    const firstName = doctor.firstName || doctor.first_name || '';
    const lastName = doctor.lastName || doctor.last_name || '';
    const firstNameAr = doctor.firstNameAr || doctor.first_name_ar || '';
    const lastNameAr = doctor.lastNameAr || doctor.last_name_ar || '';

    const arFull = [firstNameAr, lastNameAr].filter(Boolean).join(' ').trim();
    const enFull = [firstName, lastName].filter(Boolean).join(' ').trim();

    if (isArabic && arFull) return arFull;

    return (
      doctor.fullName ||
      enFull ||
      arFull ||
      ''
    ).trim();
  };

  useEffect(() => {
    if (typeof value === 'object' && value !== null) {
      const fullName = getDoctorName(value);
      setSelectedOption(value);
      setInputValue(fullName);
      return;
    }
    if (value !== inputValue) {
      setSelectedOption(null);
      setInputValue(value || '');
    }
  }, [value, i18n.language]);

  const searchDoctors = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setOptions([]);
      return [];
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
      
      const transformedDoctors = doctors.map((doctor) => {
        const normalized = {
          ...doctor,
          doctorId: doctor.doctorId || doctor.doctor_id,
          firstName: doctor.firstName || doctor.first_name,
          firstNameAr: doctor.firstNameAr || doctor.first_name_ar,
          lastName: doctor.lastName || doctor.last_name,
          lastNameAr: doctor.lastNameAr || doctor.last_name_ar,
          specialtyCode: doctor.specialtyCode || doctor.specialty_code,
          ratingScore: doctor.ratingScore ?? doctor.rating_score,
          ratingCount: doctor.ratingCount ?? doctor.rating_count,
        };

        normalized.fullName = `${normalized.firstName || ''} ${normalized.lastName || ''}`.trim();

        return normalized;
      });
      
      setOptions(transformedDoctors);
      return transformedDoctors;
    } catch (error) {
      console.error('Error searching doctors:', error);
      setOptions([]);
      return [];
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
      setSelectedOption(null);
      onChange(newInputValue || '');
    }
  };

  const handleChange = (event, newValue, reason) => {
    if (newValue && typeof newValue === 'object') {
      const fullName = getDoctorName(newValue);
      setInputValue(fullName);
      setSelectedOption(newValue);
      onChange(newValue);
      setOpen(false);
    } else if (typeof newValue === 'string') {
      setInputValue(newValue);
      setSelectedOption(null);
      onChange(newValue);
    } else if (newValue === null) {
      setInputValue('');
      setSelectedOption(null);
      onChange('');
    }
  };

  const normalizeName = (name) => {
    const raw = (name || '').trim();
    if (!raw) return '';

    const collapsed = raw.split(/\s+/).join(' ');
    const lower = collapsed.toLowerCase();

    if (lower.startsWith('dr. ')) return collapsed.slice(4).trim();
    if (lower.startsWith('dr ')) return collapsed.slice(3).trim();
    if (lower === 'dr.') return '';
    if (lower === 'dr') return '';

    if (collapsed.startsWith('د. ')) return collapsed.slice(3).trim();
    if (collapsed.startsWith('د.')) return collapsed.slice(2).trim();
    if (collapsed.startsWith('د ')) return collapsed.slice(2).trim();
    if (collapsed === 'د.' || collapsed === 'د') return '';

    return collapsed;
  };

  const findExactMatch = (candidateOptions, input) => {
    const needle = normalizeName(input).toLowerCase();
    if (!needle) return null;

    const matches = (candidateOptions || []).filter((opt) => {
      const enFull = `${opt?.firstName || opt?.first_name || ''} ${opt?.lastName || opt?.last_name || ''}`.trim();
      const arFull = `${opt?.firstNameAr || opt?.first_name_ar || ''} ${opt?.lastNameAr || opt?.last_name_ar || ''}`.trim();
      const fullName = opt?.fullName || opt?.full_name || '';

      const candidates = [fullName, enFull, arFull]
        .map((name) => normalizeName(name).toLowerCase())
        .filter(Boolean);

      return candidates.includes(needle);
    });
    return matches.length === 1 ? matches[0] : null;
  };

  const handleBlur = async () => {
    const current = (inputValue || '').trim();
    if (!current) return;

    const selectedName = normalizeName(getDoctorName(selectedOption)).toLowerCase();
    const currentName = normalizeName(current).toLowerCase();
    if (selectedOption && selectedName && selectedName === currentName) {
      return;
    }

    let match = findExactMatch(options, current);
    if (!match) {
      const results = await searchDoctors(current);
      match = findExactMatch(results, current);
    }

    if (match) {
      const fullName = getDoctorName(match);
      setSelectedOption(match);
      setInputValue(fullName);
      onChange(match);
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
      value={selectedOption || inputValue}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleChange}
      disabled={disabled}
      filterOptions={(options) => options}
      getOptionLabel={(option) => {
        if (typeof option === 'string') {
          return option;
        }
        return getDoctorName(option);
      }}
      isOptionEqualToValue={(option, value) => {
        if (typeof value === 'object' && value !== null) {
          return Boolean(option?.doctorId) && option.doctorId === value.doctorId;
        }
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
          inputProps={{
            ...params.inputProps,
            onBlur: async (e) => {
              if (params.inputProps?.onBlur) {
                params.inputProps.onBlur(e);
              }
              await handleBlur();
            },
          }}
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
      renderOption={(props, option) => {
        const displayName = getDoctorName(option);
        const specialtyRaw = option.specialtyCode || option.specialty_code || option.specialty || '';
        const specialtyCode = normalizeSpecialtyCode(specialtyRaw);
        const specialtyLabel = getLocalizedSpecialtyLabel(specialtyCode || specialtyRaw, tMedical);

        const ratingScore = option.ratingScore ?? option.rating_score ?? 0;
        const ratingCount = option.ratingCount ?? option.rating_count ?? 0;

        const expRaw = option.experience;
        const expCount = Number.parseInt(String(expRaw || '').replace(/[^0-9]/g, ''), 10);
        const expLabel = Number.isFinite(expCount)
          ? tSearch('doctorCard.yearsExperience', { count: expCount })
          : String(expRaw || '');

        return (
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
                {displayName}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <Chip
                  icon={<LocalHospitalIcon />}
                  label={specialtyLabel}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
                {expLabel && (
                  <Typography variant="caption" color="text.secondary">
                    {expLabel}
                  </Typography>
                )}
                {ratingScore > 0 && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <StarIcon sx={{ fontSize: 14, color: '#ffc107' }} />
                    <Typography variant="caption" color="text.secondary">
                      {Number(ratingScore).toFixed(1)} ({ratingCount})
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
        );
      }}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            variant="outlined"
            label={typeof option === 'string' ? option : getDoctorName(option)}
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

import React, { useState, useContext} from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  FormControl,
  FormLabel,
  Alert,
  CircularProgress,
  Divider,
  useTheme,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  ArrowForward,
  Assignment as ReceptionistIcon,
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import { AuthContext } from './../context/AuthContext';

const LoginContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
}));

const LoginPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  width: '100%',
  maxWidth: 450,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1),
    '&:hover fieldset': {
      borderColor: '#667eea',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#667eea',
    },
  },
}));

const LoginButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 4),
  fontSize: '1.1rem',
  fontWeight: 'bold',
  textTransform: 'none',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
  },
  '&:disabled': {
    background: '#ccc',
    transform: 'none',
  },
}));

const UserTypeCard = styled(Box)(({ theme, selected }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  border: `2px solid ${selected ? '#667eea' : '#e0e0e0'}`,
  backgroundColor: selected ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  '&:hover': {
    borderColor: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
  },
}));

const LoginForm = () => {
  const { login, loading, error, setError } = useAuth();
  const {
    setIsLoggedIn,
    setDoctorId,
    setPatientId,
    setUserType,
    setUserFullName,
    setUserProfilePhotoUrl,
    setUserId,
    setToken,
    setRefreshToken,
    setReceptionistId,
    setAssignedDoctorId,
  } = useContext(AuthContext);

  const [localUserType, setLocalUserType] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const result = await login({
        email,
        password,
        userType: localUserType
      });
      console.log('Login result:', result);
      
      if (result.accessToken) {
        localStorage.setItem('token', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken);
        localStorage.setItem('userId', result.userId);
        localStorage.setItem('userType', localUserType);
        localStorage.setItem('userProfilePictureUrl', result.profilePictureUrl || '');
        localStorage.setItem('userFullName', `${result.firstName} ${result.lastName}`);
        
        if (localUserType === 'doctor') {
          localStorage.setItem('doctorId', result.userId);
        } else if (localUserType === 'patient') {
          localStorage.setItem('patientId', result.userId);
        } else if (localUserType === 'receptionist') {
          localStorage.setItem('receptionistId', result.userId);
          if (result.assignedDoctorId) {
            localStorage.setItem('assignedDoctorId', result.assignedDoctorId);
            setAssignedDoctorId(result.assignedDoctorId);
          }
        }
        
        setIsLoggedIn(true);
        setToken(result.accessToken);
        setRefreshToken(result.refreshToken);
        setUserType(localUserType);
        setUserFullName(`${result.firstName} ${result.lastName}`);
        setUserProfilePhotoUrl(result.profilePictureUrl || '');
        setUserId(result.userId);
        
        if (localUserType === 'receptionist') {
          setReceptionistId(result.userId);
        } else if (localUserType === 'doctor') {
          setDoctorId(result.userId);
        } else if (localUserType === 'patient') {
          setPatientId(result.userId);
        }

        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login error: ' + error.message);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <LoginContainer>
        <LoginPaper elevation={10}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
              Welcome Back! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to your account to continue
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* User Type Selection */}
            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
              <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
                I am a:
              </FormLabel>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <UserTypeCard
                  selected={localUserType === 'patient'}
                  onClick={() => setLocalUserType('patient')}
                  sx={{ flex: 1 }}
                >
                  <PersonIcon sx={{ color: localUserType === 'patient' ? '#667eea' : '#666' }} />
                  <Typography sx={{ fontWeight: localUserType === 'patient' ? 'bold' : 'normal' }}>
                    Patient
                  </Typography>
                </UserTypeCard>
                <UserTypeCard
                  selected={localUserType === 'doctor'}
                  onClick={() => setLocalUserType('doctor')}
                  sx={{ flex: 1 }}
                >
                  <HospitalIcon sx={{ color: localUserType === 'doctor' ? '#667eea' : '#666' }} />
                  <Typography sx={{ fontWeight: localUserType === 'doctor' ? 'bold' : 'normal' }}>
                    Doctor
                  </Typography>
                </UserTypeCard>
                <UserTypeCard
                  selected={localUserType === 'receptionist'}
                  onClick={() => setLocalUserType('receptionist')}
                  sx={{ flex: 1 }}
                >
                  <ReceptionistIcon sx={{ color: localUserType === 'receptionist' ? '#667eea' : '#666' }} />
                  <Typography sx={{ fontWeight: localUserType === 'receptionist' ? 'bold' : 'normal' }}>
                    Receptionist
                  </Typography>
                </UserTypeCard>
              </Box>
            </FormControl>

            {/* Email Field */}
            <StyledTextField
              fullWidth
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {/* Password Field */}
            <StyledTextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            {/* Login Button */}
            <LoginButton
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
              sx={{ mb: 2 }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </LoginButton>

            {/* Forgot Password */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Button
                component={Link}
                to="/forgot-password"
                variant="text"
                sx={{ 
                  color: '#667eea', 
                  textTransform: 'none',
                  '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.05)' }
                }}
              >
                Forgot Password?
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Sign Up Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Button
                  component={Link}
                  to="/register"
                  variant="text"
                  sx={{
                    color: '#667eea',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    p: 0,
                    minWidth: 'auto',
                    '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  Sign Up
                </Button>
              </Typography>
            </Box>
          </form>
        </LoginPaper>
    </LoginContainer>
  );
};

export default LoginForm;

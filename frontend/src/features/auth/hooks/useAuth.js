import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';

export const useAuth = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (credentials) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await authService.login(credentials);
      console.log("Login result: ", result);      
      if (authContext && authContext.login) {
        authContext.login(result.userId, result.userType);
      }
      
      if (result.userType === 'doctor') {
        navigate('/feed');
      } else if (result.userType === 'patient') {
        navigate('/patient-appointments');
      } else if (result.userType === 'receptionist') {
        navigate('/receptionist-dashboard');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    if (authContext && authContext.logout) {
      authContext.logout();
    }
  };

  const register = async (userData, userType) => {
    setLoading(true);
    setError('');
    
    try {
      let result;
      
      switch (userType) {
        case 'doctor':
          result = await authService.registerDoctor(userData);
          break;
        case 'patient':
          result = await authService.registerPatient(userData);
          break;
        case 'receptionist':
          result = await authService.registerReceptionist(userData);
          break;
        default:
          throw new Error('Invalid user type');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await authService.forgotPassword(email);
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (resetData) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await authService.resetPassword(resetData);
      navigate('/login');
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    loading,
    error,
    setError,
    isAuthenticated: authService.isAuthenticated(),
    currentUser: authService.getCurrentUser()
  };
};

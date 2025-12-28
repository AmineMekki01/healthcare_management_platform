import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';

export const useAuth = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['auth']);
  const authContext = useContext(AuthContext);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (credentials) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await authService.login(credentials);
      console.log("Login result: ", result);      
      
      if (result.userType === 'doctor') {
        navigate('/feed');
      } else if (result.userType === 'patient') {
        navigate('/patient-appointments');
      } else if (result.userType === 'receptionist') {
        navigate('/receptionist-dashboard');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.message || t('auth:errors.loginFailed');
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
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
          throw new Error(t('auth:errors.invalidUserType'));
      }
      
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.message || t('auth:errors.registrationFailed');
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
      const errorMessage = error.response?.data?.message || t('auth:passwordReset.requestFailed');
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
      const errorMessage = error.response?.data?.message || t('auth:resetPassword.updateFailed');
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

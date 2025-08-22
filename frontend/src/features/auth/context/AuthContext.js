import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

const AuthProvider = ({ children, navigate }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [userType, setUserType] = useState(localStorage.getItem('userType') || 'patient');
    const [doctorId, setDoctorId] = useState(localStorage.getItem('doctorId'));
    const [patientId, setPatientId] = useState(localStorage.getItem('patientId'));
    const [receptionistId, setReceptionistId] = useState(localStorage.getItem('receptionistId'));
    const [assignedDoctorId, setAssignedDoctorId] = useState(localStorage.getItem('assignedDoctorId'));
    const [userName, setUserName] = useState(null);
    const [userAge, setUserAge] = useState(null);
    const [userFullName, setUserFullName] = useState(null);
    const [userProfilePictureUrl, setUserProfilePhotoUrl] = useState(null);
    const [userId, setUserId] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));


    useEffect(() => {   
        if (localStorage.getItem('token')) {
            setUserFullName(localStorage.getItem('userFullName'));
            setUserType(localStorage.getItem('userType'));
            setUserProfilePhotoUrl(localStorage.getItem("userProfilePictureUrl"));
            setToken(localStorage.getItem('token'));
            setDoctorId(localStorage.getItem('doctorId'));
            setPatientId(localStorage.getItem('patientId'));
            setReceptionistId(localStorage.getItem('receptionistId'));
            setAssignedDoctorId(localStorage.getItem('assignedDoctorId'));
            setRefreshToken(localStorage.getItem('refreshToken'));

            const userType = localStorage.getItem('userType');
            if (userType === 'doctor') {
                const doctorId = localStorage.getItem('doctorId');
                if (doctorId && doctorId !== 'null' && doctorId !== 'undefined') {
                    setUserId(doctorId);
                }
            } else if (userType === 'receptionist') {
                const receptionistId = localStorage.getItem('receptionistId');
                if (receptionistId && receptionistId !== 'null' && receptionistId !== 'undefined') {
                    setUserId(receptionistId);
                }
            } else {
                const patientId = localStorage.getItem('patientId');
                if (patientId && patientId !== 'null' && patientId !== 'undefined') {
                    setUserId(patientId);
                }
            }
            setIsLoggedIn(true);
        }
    }, []);

    const logout = useCallback(() => {
        if (window.inactivityTimeout) clearTimeout(window.inactivityTimeout);
        if (window.logoutTimeout) clearTimeout(window.logoutTimeout);

        localStorage.removeItem('token');
        localStorage.removeItem('doctorId');
        localStorage.removeItem('patientId');
        localStorage.removeItem('receptionistId');
        localStorage.removeItem('assignedDoctorId');
        localStorage.removeItem('userType');
        localStorage.removeItem('userFullName');
        localStorage.removeItem('userProfilePictureUrl');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('activeRoleMode');

        setToken(null);
        setDoctorId(null);
        setPatientId(null);
        setReceptionistId(null);
        setAssignedDoctorId(null);
        setIsLoggedIn(false);
        setUserType(null);
        setUserFullName(null);
        setUserProfilePhotoUrl(null);
        setUserId(null);
        setRefreshToken(null);

        try {
            if (navigate && typeof navigate === 'function') {
                navigate('/login');
            } else {
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Navigation error during logout:', error);
            window.location.href = '/login';
        }
    }, [navigate]);


    const refreshAccessToken = useCallback(async () => {
        try {
            const data = await authService.refreshToken();
            setToken(data.accessToken);
            localStorage.setItem('token', data.accessToken);
            return true;
        } catch (error) {
            console.error("Failed to refresh token", error);
            logout();
            return false;
        }
    }, [logout]);


    
    useEffect(() => {
        if (isLoggedIn) {
            const refreshInterval = setInterval(() => {
                refreshAccessToken();
            }, 15 * 60 * 1000);

            return () => clearInterval(refreshInterval);
        }
    }, [isLoggedIn, refreshAccessToken]);


    return (
        <AuthContext.Provider value={{
            isLoggedIn,
            userName,
            userAge,
            userType,
            doctorId,
            patientId,
            receptionistId,
            assignedDoctorId,
            userFullName,
            userProfilePictureUrl,
            userId,
            token,
            setIsLoggedIn,
            setUserName,
            setUserAge,
            setUserType,
            setDoctorId,
            setPatientId,
            setReceptionistId,
            setAssignedDoctorId,
            logout,
            setUserFullName,
            setUserProfilePhotoUrl,
            setUserId,
            setToken,
            setRefreshToken,
            refreshAccessToken
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
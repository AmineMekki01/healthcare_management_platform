import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

const AuthProvider = ({ children, navigate }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [userType, setUserType] = useState(localStorage.getItem('userType') || 'patient');
    const [doctorId, setDoctorId] = useState(localStorage.getItem('doctorId'));
    const [patientId, setPatientId] = useState(localStorage.getItem('patientId'));  
    const [userName, setUserName] = useState(null);
    const [userAge, setUserAge] = useState(null);
    const [userFullName, setUserFullName] = useState(null);
    const [userProfilePhotoUrl, setUserProfilePhotoUrl] = useState(null);
    const [userId, setUserId] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));


    useEffect(() => {   
        if (localStorage.getItem('token')) {
            setIsLoggedIn(true);
            setUserFullName(localStorage.getItem('userFullName'));
            setUserType(localStorage.getItem('userType'));
            setUserProfilePhotoUrl(localStorage.getItem("userProfilePhotoUrl"));
            setToken(localStorage.getItem('token'));
            setDoctorId(localStorage.getItem('doctorId'));
            setPatientId(localStorage.getItem('patientId'));
            setRefreshToken(localStorage.getItem('refreshToken'));

            const userType = localStorage.getItem('userType');
            if (userType === 'doctor') {
                const doctorId = localStorage.getItem('doctorId');
                if (doctorId && doctorId !== 'null' && doctorId !== 'undefined') {
                    setUserId(doctorId);
                }
            } else {
                const patientId = localStorage.getItem('patientId');
                if (patientId && patientId !== 'null' && patientId !== 'undefined') {
                    setUserId(patientId);
                }
            }
        }
    }, []);

    const logout = useCallback(() => {
        if (window.inactivityTimeout) clearTimeout(window.inactivityTimeout);
        if (window.logoutTimeout) clearTimeout(window.logoutTimeout);

        localStorage.removeItem('token');
        localStorage.removeItem('doctorId');
        localStorage.removeItem('patientId');  
        localStorage.removeItem('userType');
        localStorage.removeItem('userFullName');
        localStorage.removeItem('userProfilePhotoUrl');
        localStorage.removeItem('refreshToken');

        setToken(null);
        setDoctorId(null);
        setPatientId(null);  
        setIsLoggedIn(false);
        setUserType(null);
        setUserFullName(null);
        setUserProfilePhotoUrl(null);
        setUserId(null);
        setRefreshToken(null);

        navigate('/login');
    }, [navigate]);


    const refreshAccessToken = useCallback(async () => {
        try {
            const storedRefreshToken = localStorage.getItem('refreshToken');
            if (!storedRefreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch('http://localhost:3001/api/v1/refresh-token', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${storedRefreshToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setToken(data.accessToken);
                localStorage.setItem('token', data.accessToken);
                return true;
            } else {
                throw new Error('Failed to refresh token');
            }
        } catch (error) {
            console.error("Failed to refresh token", error);
            logout();
            return false;
        }
    }, [token, logout]);


    
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
            userFullName,
            userProfilePhotoUrl,
            userId,
            token,
            setIsLoggedIn,
            setUserName,
            setUserAge,
            setUserType,
            setDoctorId,
            setPatientId, 
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
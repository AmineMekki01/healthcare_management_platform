import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

const AuthProvider = ({ children, navigate }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('userId'));
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


    useEffect(() => {
        const bootstrap = async () => {
            setUserFullName(localStorage.getItem('userFullName'));
            setUserType(localStorage.getItem('userType'));
            setUserProfilePhotoUrl(localStorage.getItem("userProfilePictureUrl"));
            setDoctorId(localStorage.getItem('doctorId'));
            setPatientId(localStorage.getItem('patientId'));
            setReceptionistId(localStorage.getItem('receptionistId'));
            setAssignedDoctorId(localStorage.getItem('assignedDoctorId'));

            const storedUserId = localStorage.getItem('userId');
            if (storedUserId && storedUserId !== 'null' && storedUserId !== 'undefined') {
                setUserId(storedUserId);
            }

            try {
                const me = await authService.me();
                if (me?.userId && me?.userType) {
                    const resolvedUserId = String(me.userId);
                    const resolvedUserType = String(me.userType);

                    localStorage.setItem('userId', resolvedUserId);
                    localStorage.setItem('userType', resolvedUserType);

                    if (resolvedUserType === 'doctor') {
                        localStorage.setItem('doctorId', resolvedUserId);
                        setDoctorId(resolvedUserId);
                    } else if (resolvedUserType === 'receptionist') {
                        localStorage.setItem('receptionistId', resolvedUserId);
                        setReceptionistId(resolvedUserId);
                    } else {
                        localStorage.setItem('patientId', resolvedUserId);
                        setPatientId(resolvedUserId);
                    }

                    setUserId(resolvedUserId);
                    setUserType(resolvedUserType);
                    setIsLoggedIn(true);
                    return;
                }
            } catch (error) {
                localStorage.removeItem('doctorId');
                localStorage.removeItem('patientId');
                localStorage.removeItem('receptionistId');
                localStorage.removeItem('assignedDoctorId');
                localStorage.removeItem('userType');
                localStorage.removeItem('userFullName');
                localStorage.removeItem('userProfilePictureUrl');
                localStorage.removeItem('userId');
                localStorage.removeItem('activeRoleMode');
                setDoctorId(null);
                setPatientId(null);
                setReceptionistId(null);
                setAssignedDoctorId(null);
                setUserType('patient');
                setUserFullName(null);
                setUserProfilePhotoUrl(null);
                setUserId(null);
                setIsLoggedIn(false);
            }

            setIsLoggedIn(!!localStorage.getItem('userId'));
        };

        bootstrap();
    }, []);

    const logout = useCallback(() => {
        if (window.inactivityTimeout) clearTimeout(window.inactivityTimeout);
        if (window.logoutTimeout) clearTimeout(window.logoutTimeout);

        authService.logout().catch(() => {
        });

        localStorage.removeItem('doctorId');
        localStorage.removeItem('patientId');
        localStorage.removeItem('receptionistId');
        localStorage.removeItem('assignedDoctorId');
        localStorage.removeItem('userType');
        localStorage.removeItem('userFullName');
        localStorage.removeItem('userProfilePictureUrl');
        localStorage.removeItem('userId');
        localStorage.removeItem('activeRoleMode');

        setDoctorId(null);
        setPatientId(null);
        setReceptionistId(null);
        setAssignedDoctorId(null);
        setIsLoggedIn(false);
        setUserType(null);
        setUserFullName(null);
        setUserProfilePhotoUrl(null);
        setUserId(null);

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
            await authService.refreshToken();
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
            refreshAccessToken
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const InactivityPopMessageContainer = styled.div`
    display: flex;
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    background-color: #121F49;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
    z-index: 10000;
    padding: 20px;
    border-radius: 8px;
`;

const InactivityPopMessageTitle = styled.div`
    color: white;
    padding: 20px 20px;
    text-align: center;
`;

const InactivityPopMessageButtonContainer = styled.div`
    display: flex;
    color: white;
    width: 100%;
    justify-content: space-around;
    margin-top: 20px;
`;

const InactivityPopMessageButton = styled.button`
    padding: 10px 20px;
    background-color: ${props => props.primary ? '#45A049' : '#D32F2F'};
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
`;

const InactivityHandler = () => {
    const { logout, token, setToken } = useContext(AuthContext);
    const [isPopupVisible, setPopupVisible] = useState(false);
    const navigate = useNavigate();

    const INACTIVITY_THRESHOLD = 18 * 60 * 1000;
    const LOGOUT_DELAY = 2 *  60 * 1000;

    const resetInactivityTimer = useCallback(() => {
        if (window.inactivityTimeout) {
            clearTimeout(window.inactivityTimeout);
        }
        if (window.logoutTimeout) {
            clearTimeout(window.logoutTimeout);
        }

        window.inactivityTimeout = setTimeout(() => {
            setPopupVisible(true);
            window.logoutTimeout = setTimeout(() => {
                logout();
                navigate('/login');
            }, LOGOUT_DELAY);
        }, INACTIVITY_THRESHOLD);
    }, [logout, navigate]);

    useEffect(() => {
        resetInactivityTimer();

        const handleUserActivity = () => {
            resetInactivityTimer();
        };

        window.addEventListener('mousemove', handleUserActivity);
        window.addEventListener('keydown', handleUserActivity);

        return () => {
            if (window.inactivityTimeout) clearTimeout(window.inactivityTimeout);
            if (window.logoutTimeout) clearTimeout(window.logoutTimeout);
            window.removeEventListener('mousemove', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
        };
    }, [resetInactivityTimer]);

    const handleSessionExtend = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/v1/refresh-token', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setToken(data.token);
                localStorage.setItem('token', data.token);
                setPopupVisible(false);
                resetInactivityTimer();
            } else {
                throw new Error('Failed to refresh token');
            }
        } catch (error) {
            console.error("Failed to refresh token", error);
            logout();
            navigate('/login');
        }
    };

    const handleLogout = () => {
        setPopupVisible(false);
        logout();
        navigate('/login');
    };

    return (
        isPopupVisible && (
            <InactivityPopMessageContainer>
                <InactivityPopMessageTitle>Your session is about to expire. Do you want to continue?</InactivityPopMessageTitle>
                <InactivityPopMessageButtonContainer>
                    <InactivityPopMessageButton primary onClick={handleSessionExtend}>Yes, continue</InactivityPopMessageButton>
                    <InactivityPopMessageButton onClick={handleLogout}>No, logout</InactivityPopMessageButton>
                </InactivityPopMessageButtonContainer>
            </InactivityPopMessageContainer>
        )
    );
};

export default InactivityHandler;
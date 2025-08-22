import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Button } from './../styles/LoginRegisterFormStyles';
import authService from '../services/authService';

const CenteredDiv = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 300px;
    margin: auto;
    height: 300px;
    border: 1px solid black;
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);


`;

const Container = styled.div`

    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f0f0f0;
`;


const Title = styled.h1`
    font-size: 24px;
    margin-bottom: 20px;
    text-align: center;
`;

function AccountVerified() {
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get('token');
        if (token) {
            authService.verifyAccount(token)
                .then((data) => {
                    setMessage(data.message);
                })
                .catch((error) => {
                    setMessage(error.response?.data?.message || 'Account verification failed');
                });
        }
    }, []); 

    const handleLogin = () => {
        navigate('/login'); 
    };

    return (
        <Container>
            <CenteredDiv className="centered">
                <Title>{message}</Title>
                <Button onClick={handleLogin}>Login</Button>
            </CenteredDiv>
        </Container>

    );
}

export default AccountVerified;

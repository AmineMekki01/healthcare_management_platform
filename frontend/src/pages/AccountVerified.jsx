import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '../components/Auth/styles/LoginRegisterFormStyles';
import { useNavigate } from 'react-router-dom';

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
        console.log("window.location.search", window.location.search);
        const token = new URLSearchParams(window.location.search).get('token');
        console.log("token", token);
        if (token) {
            const url = `http://localhost:3001/activate_account?token=${token}`;
            fetch(url)
                .then((response) => response.json())
                .then((data) => {
                    console.log("data", data);
                    setMessage(data.message);
                })
                .catch((error) => {
                    console.error('Error:', error);
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

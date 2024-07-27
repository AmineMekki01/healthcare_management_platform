// ResetPasswordForm.js

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ContainerLogin, FormWrapper, Title, Input, Button, ContentWrapper } from './styles/LoginRegisterFormStyles';

const ResetPasswordForm = () => {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const token = searchParams.get('token'); 

    const handleNewPassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage("Passwords don't match!");
            return;
        }
        try {
            const response = await fetch('http://localhost:3001/api/v1/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, newPassword: password }),
            });
            const data = await response.json();
            setMessage(data.message);
        } catch (error) {
            console.error('Failed to update password:', error);
            setMessage('Failed to update password. Please try again.');
        }
    };

    return (
        <ContainerLogin>
            <FormWrapper>
                <Title>Reset Your Password</Title>
                {message && <p>{message}</p>}
                <form onSubmit={handleNewPassword}>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="New Password"
                        required
                    />
                    <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm New Password"
                        required
                    />
                    <ContentWrapper>
                        <Button type="submit" href="/login">Change Password</Button>
                    </ContentWrapper>
                </form>
            </FormWrapper>
        </ContainerLogin>
    );
};

export default ResetPasswordForm;

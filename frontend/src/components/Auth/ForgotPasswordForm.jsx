// ForgotPasswordForm.js
import React, { useState } from 'react';
import { ContainerLogin, FormWrapper, Title, RadioButtonContainer, RadioButton, Input, Button, ContentWrapper } from './styles/LoginRegisterFormStyles';

const ForgotPasswordForm = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [localUserType, setLocalUserType] = useState('patient'); 

    const handleResetRequest = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3001/api/v1/request-reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, localUserType }),
            });
            const data = await response.json();
            setMessage(data.message);
        } catch (error) {
            console.error('Error sending reset request:', error);
            setMessage('Failed to send reset request. Please try again.');
        }
    };

    return (
        <ContainerLogin>
            <FormWrapper>
                <Title>Reset Your Password</Title>
                {message && <p>{message}</p>}
                <form onSubmit={handleResetRequest}>
                    <RadioButtonContainer>
                        <RadioButton>
                            <input
                                type="radio"
                                name="userType"
                                value="doctor"
                                checked={localUserType === 'doctor'}
                                onChange={() => setLocalUserType('doctor')}
                            />
                            <span></span>
                            I am a Doctor
                        </RadioButton>
                        <RadioButton>
                            <input
                                type="radio"
                                name="userType"
                                value="patient"
                                checked={localUserType === 'patient'}
                                onChange={() => setLocalUserType('patient')}
                            />
                            <span></span>
                            I am a Patient
                        </RadioButton>
                    </RadioButtonContainer>
                    <ContentWrapper>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                        <Button type="submit" >Send Reset Link</Button>
                    </ContentWrapper>
                </form>
            </FormWrapper>
        </ContainerLogin>
    );
};

export default ForgotPasswordForm;

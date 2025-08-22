import React, { useState } from 'react';
import { ContainerLogin, FormWrapper, Title, RadioButtonContainer, RadioButton, Input, Button, ContentWrapper } from './../styles/LoginRegisterFormStyles';
import authService from '../services/authService';

const ForgotPasswordForm = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [localUserType, setLocalUserType] = useState('patient'); 

    const handleResetRequest = async (e) => {
        e.preventDefault();
        try {
            const data = await authService.requestPasswordReset(email, localUserType);
            setMessage(data.message);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to send reset request. Please try again.');
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

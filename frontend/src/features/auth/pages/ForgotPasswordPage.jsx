import React, { useState } from 'react';
import { ContainerLogin, FormWrapper, Title, RadioButtonContainer, RadioButton, Input, Button, ContentWrapper } from './../styles/LoginRegisterFormStyles';
import authService from '../services/authService';
import { useTranslation } from 'react-i18next';

const ForgotPasswordForm = () => {
    const { t } = useTranslation(['auth', 'common']);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [localUserType, setLocalUserType] = useState('patient'); 

    const handleResetRequest = async (e) => {
        e.preventDefault();
        try {
            const data = await authService.requestPasswordReset(email, localUserType);
            setMessage(data.message || t('auth:passwordReset.requestSuccess'));
        } catch (error) {
            setMessage(error.response?.data?.message || t('auth:passwordReset.requestFailed'));
        }
    };

    return (
        <ContainerLogin>
            <FormWrapper>
                <Title>{t('auth:passwordReset.title')}</Title>
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
                            {t('auth:passwordReset.userTypeDoctor')}
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
                            {t('auth:passwordReset.userTypePatient')}
                        </RadioButton>
                    </RadioButtonContainer>
                    <ContentWrapper>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('auth:passwordReset.emailPlaceholder')}
                            required
                        />
                        <Button type="submit" >{t('auth:passwordReset.sendResetLink')}</Button>
                    </ContentWrapper>
                </form>
            </FormWrapper>
        </ContainerLogin>
    );
};

export default ForgotPasswordForm;

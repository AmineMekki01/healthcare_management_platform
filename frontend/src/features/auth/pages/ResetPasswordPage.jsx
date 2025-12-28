import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ContainerLogin, FormWrapper, Title, Input, Button, ContentWrapper } from './../styles/LoginRegisterFormStyles';
import authService from '../services/authService';
import { useTranslation } from 'react-i18next';

const ResetPasswordForm = () => {
    const { t } = useTranslation(['auth', 'common']);
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const token = searchParams.get('token'); 

    const handleNewPassword = async (e) => {
        e.preventDefault();
        if (!token) {
            setMessage(t('auth:resetPassword.missingToken'));
            return;
        }
        if (password !== confirmPassword) {
            setMessage(t('auth:resetPassword.passwordsDontMatch'));
            return;
        }
        try {
            const data = await authService.resetPassword(token, password);
            setMessage(data.message);
        } catch (error) {
            console.error('Failed to update password:', error);
            setMessage(error.response?.data?.message || t('auth:resetPassword.updateFailed'));
        }
    };

    return (
        <ContainerLogin>
            <FormWrapper>
                <Title>{t('auth:resetPassword.title')}</Title>
                {message && <p>{message}</p>}
                <form onSubmit={handleNewPassword}>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('auth:resetPassword.newPasswordPlaceholder')}
                        required
                    />
                    <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('auth:resetPassword.confirmPasswordPlaceholder')}
                        required
                    />
                    <ContentWrapper>
                        <Button type="submit" href="/login">{t('auth:resetPassword.changePassword')}</Button>
                    </ContentWrapper>
                </form>
            </FormWrapper>
        </ContainerLogin>
    );
};

export default ResetPasswordForm;

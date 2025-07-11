import React, { useState } from 'react';
import styled from 'styled-components';
import {
  FormContainer,
  FormRow,
  FormGroup,
  Label,
  Input,
  Button,
  StatusMessage,
} from './CommonComponents';

const SecurityContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
`;

const SecurityHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
`;

const SecurityTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
`;

const SecurityDescription = styled.p`
  color: #7f8c8d;
  margin-bottom: 24px;
  line-height: 1.6;
`;

const PasswordStrengthIndicator = styled.div`
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  margin-top: 8px;
  overflow: hidden;
`;

const PasswordStrengthBar = styled.div`
  height: 100%;
  width: ${props => props.strength}%;
  background: ${props => 
    props.strength < 25 ? '#ff6b6b' :
    props.strength < 50 ? '#ffa726' :
    props.strength < 75 ? '#42a5f5' :
    '#4CAF50'
  };
  transition: all 0.3s ease;
`;

const PasswordStrengthText = styled.div`
  font-size: 12px;
  color: ${props => 
    props.strength < 25 ? '#ff6b6b' :
    props.strength < 50 ? '#ffa726' :
    props.strength < 75 ? '#42a5f5' :
    '#4CAF50'
  };
  margin-top: 4px;
  font-weight: 500;
`;

const SecurityIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11C15.4,11 16,11.4 16,12V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V12C8,11.4 8.4,11 9,11V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z"/>
  </svg>
);

export default function SecuritySettings() {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthText = (strength) => {
    if (strength < 25) return 'Very Weak';
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validation
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setError('Please fill in all password fields');
      setLoading(false);
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwords.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      // Replace with actual API call
      // await axios.put('/api/v1/user/change-password', {
      //   currentPassword: passwords.currentPassword,
      //   newPassword: passwords.newPassword,
      // });
      
      setSuccess(true);
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = calculatePasswordStrength(passwords.newPassword);

  return (
    <SecurityContainer>
      <SecurityHeader>
        <SecurityIcon />
        <SecurityTitle>Security Settings</SecurityTitle>
      </SecurityHeader>
      
      <SecurityDescription>
        Keep your account secure by regularly updating your password. 
        Use a strong password with a mix of letters, numbers, and symbols.
      </SecurityDescription>

      {error && (
        <StatusMessage type="error">
          {error}
        </StatusMessage>
      )}
      
      {success && (
        <StatusMessage type="success">
          Password updated successfully!
        </StatusMessage>
      )}

      <FormContainer>
        <FormGroup>
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            placeholder="Enter your current password"
            value={passwords.currentPassword}
            onChange={handleChange}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            placeholder="Enter your new password"
            value={passwords.newPassword}
            onChange={handleChange}
          />
          {passwords.newPassword && (
            <>
              <PasswordStrengthIndicator>
                <PasswordStrengthBar strength={passwordStrength} />
              </PasswordStrengthIndicator>
              <PasswordStrengthText strength={passwordStrength}>
                {getPasswordStrengthText(passwordStrength)}
              </PasswordStrengthText>
            </>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm your new password"
            value={passwords.confirmPassword}
            onChange={handleChange}
          />
        </FormGroup>

        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </Button>
      </FormContainer>
    </SecurityContainer>
  );
}

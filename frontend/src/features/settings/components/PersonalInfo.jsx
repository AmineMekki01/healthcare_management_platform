import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../../../components/axiosConfig';
import { AuthContext } from './../../../features/auth/context/AuthContext';
import {
  FormContainer,
  FormRow,
  FormGroup,
  Label,
  Input,
  TextArea,
  Button,
  FileUploadContainer,
  FileUploadArea,
  FileUploadText,
  FileUploadSubtext,
  AvatarContainer,
  Avatar,
  AvatarPlaceholder,
  StatusMessage,
  UploadIcon,
  SaveIcon,
  LoadingIcon,
} from './CommonComponents';
import { settingsService } from '../services/settingsService';

export default function PersonalInfo({ userId }) {
  const { t } = useTranslation('settings');
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    clinicPhoneNumber: '',
    showClinicPhone: true,
    bio: '',
    streetAddress: '',
    cityName: '',
    stateName: '',
    zipCode: '',
    countryName: '',
    profilePictureUrl: '',
    birthDate: '',
    sex: '',
    age: null,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { userType, setUserFullName, setUserProfilePhotoUrl } = useContext(AuthContext);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;

    try {
      const data = await settingsService.getPersonalInfo(userId, userType);
      console.log('Profile fetched:', data);
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(t('personalInfo.errors.loadFailed'));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    
    formData.append('firstName', profile.firstName);
    formData.append('lastName', profile.lastName);
    formData.append('email', profile.email);
    formData.append('phoneNumber', profile.phoneNumber);
    if (userType === 'doctor') {
      formData.append('clinicPhoneNumber', profile.clinicPhoneNumber || '');
      formData.append('showClinicPhone', String(!!profile.showClinicPhone));
    }
    formData.append('bio', profile.bio);
    formData.append('cityName', profile.cityName);
    formData.append('stateName', profile.stateName || '');
    formData.append('zipCode', profile.zipCode);
    formData.append('countryName', profile.countryName);
    formData.append('streetAddress', profile.streetAddress);
    
    if (selectedFile) {
      formData.append('profilePhoto', selectedFile);
    }

    try {
      const data = await settingsService.updatePersonalInfo(userId, formData, userType);
      console.log('Profile updated:', data);
      setSuccess(true);
      
      setProfile(data);
      
      if (data.profilePictureUrl) {
        setUserProfilePhotoUrl(data.profilePictureUrl);
      }

      if (data.firstName && data.lastName) {
        setUserFullName(`${data.firstName} ${data.lastName}`);
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.error || t('personalInfo.errors.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <FormContainer>
      {error && (
        <StatusMessage type="error">
          {error}
        </StatusMessage>
      )}
      
      {success && (
        <StatusMessage type="success">
          {t('personalInfo.success.profileUpdated')}
        </StatusMessage>
      )}

      <AvatarContainer>
        {profile.profilePictureUrl ? (
          <Avatar
            src={profile.profilePictureUrl}
            alt={`${profile.firstName} ${profile.lastName}`}
          />
        ) : (
          <AvatarPlaceholder>
            {getInitials(profile.firstName, profile.lastName)}
          </AvatarPlaceholder>
        )}
        
        <FileUploadContainer>
          <FileUploadArea>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              id="profilePhoto"
            />
            <label htmlFor="profilePhoto">
              <UploadIcon />
              <FileUploadText>
                {selectedFile ? selectedFile.name : t('personalInfo.profilePhoto.upload')}
              </FileUploadText>
              <FileUploadSubtext>
                {t('personalInfo.profilePhoto.instructions')}
              </FileUploadSubtext>
            </label>
          </FileUploadArea>
        </FileUploadContainer>
      </AvatarContainer>

      <FormRow>
        <FormGroup>
          <Label htmlFor="firstName">{t('personalInfo.fields.firstName.label')}</Label>
          <Input
            id="firstName"
            name="firstName"
            placeholder={t('personalInfo.fields.firstName.placeholder')}
            value={profile.firstName || ''}
            onChange={handleChange}
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="lastName">{t('personalInfo.fields.lastName.label')}</Label>
          <Input
            id="lastName"
            name="lastName"
            placeholder={t('personalInfo.fields.lastName.placeholder')}
            value={profile.lastName || ''}
            onChange={handleChange}
          />
        </FormGroup>
      </FormRow>

      <FormRow>
        <FormGroup>
          <Label htmlFor="email">{t('personalInfo.fields.email.label')}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t('personalInfo.fields.email.placeholder')}
            value={profile.email || ''}
            onChange={handleChange}
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="phoneNumber">{t('personalInfo.fields.phoneNumber.label')}</Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            placeholder={t('personalInfo.fields.phoneNumber.placeholder')}
            value={profile.phoneNumber || ''}
            onChange={handleChange}
          />
        </FormGroup>
      </FormRow>

      {userType === 'doctor' && (
        <>
          <FormRow>
            <FormGroup>
              <Label htmlFor="clinicPhoneNumber">{t('personalInfo.fields.clinicPhoneNumber.label')}</Label>
              <Input
                id="clinicPhoneNumber"
                name="clinicPhoneNumber"
                type="tel"
                placeholder={t('personalInfo.fields.clinicPhoneNumber.placeholder')}
                value={profile.clinicPhoneNumber || ''}
                onChange={handleChange}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="showClinicPhone">{t('personalInfo.fields.showClinicPhone.label')}</Label>
              <Input
                id="showClinicPhone"
                name="showClinicPhone"
                type="checkbox"
                checked={!!profile.showClinicPhone}
                onChange={(e) => setProfile(prev => ({ ...prev, showClinicPhone: e.target.checked }))}
              />
            </FormGroup>
          </FormRow>
        </>
      )}

      {/* Personal Information Section */}
      {profile.birthDate && (
        <FormRow>
          <FormGroup>
            <Label htmlFor="birthDate">{t('personalInfo.fields.birthDate.label')}</Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              value={profile.birthDate || ''}
              onChange={handleChange}
              readOnly
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="sex">{t('personalInfo.fields.gender.label')}</Label>
            <Input
              id="sex"
              name="sex"
              placeholder={t('personalInfo.fields.gender.placeholder')}
              value={profile.sex || ''}
              onChange={handleChange}
              readOnly
            />
          </FormGroup>
        </FormRow>
      )}

      <FormGroup>
        <Label htmlFor="streetAddress">{t('personalInfo.fields.streetAddress.label')}</Label>
        <Input
          id="streetAddress"
          name="streetAddress"
          placeholder={t('personalInfo.fields.streetAddress.placeholder')}
          value={profile.streetAddress || ''}
          onChange={handleChange}
        />
      </FormGroup>

      <FormRow>
        <FormGroup>
          <Label htmlFor="cityName">{t('personalInfo.fields.city.label')}</Label>
          <Input
            id="cityName"
            name="cityName"
            placeholder={t('personalInfo.fields.city.placeholder')}
            value={profile.cityName || ''}
            onChange={handleChange}
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="stateName">{t('personalInfo.fields.state.label')}</Label>
          <Input
            id="stateName"
            name="stateName"
            placeholder={t('personalInfo.fields.state.placeholder')}
            value={profile.stateName || ''}
            onChange={handleChange}
          />
        </FormGroup>
      </FormRow>

      <FormRow>
        <FormGroup>
          <Label htmlFor="zipCode">{t('personalInfo.fields.zipCode.label')}</Label>
          <Input
            id="zipCode"
            name="zipCode"
            placeholder={t('personalInfo.fields.zipCode.placeholder')}
            value={profile.zipCode || ''}
            onChange={handleChange}
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="countryName">{t('personalInfo.fields.country.label')}</Label>
          <Input
            id="countryName"
            name="countryName"
            placeholder={t('personalInfo.fields.country.placeholder')}
            value={profile.countryName || ''}
            onChange={handleChange}
          />
        </FormGroup>
      </FormRow>

      <FormGroup>
        <Label htmlFor="bio">{t('personalInfo.fields.bio.label')}</Label>
        <TextArea
          id="bio"
          name="bio"
          placeholder={t('personalInfo.fields.bio.placeholder')}
          value={profile.bio || ''}
          onChange={handleChange}
        />
      </FormGroup>

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? <LoadingIcon /> : <SaveIcon />}
        {loading ? t('personalInfo.buttons.updating') : t('personalInfo.buttons.updateProfile')}
      </Button>
    </FormContainer>
  );
}

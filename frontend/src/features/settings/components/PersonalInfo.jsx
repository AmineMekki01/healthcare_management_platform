import React, { useState, useEffect, useContext } from 'react';
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
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
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
      setError('Failed to load profile information');
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
      setError(error.response?.data?.error || 'Error updating profile. Please try again.');
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
          Profile updated successfully!
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
                {selectedFile ? selectedFile.name : 'Upload Profile Photo'}
              </FileUploadText>
              <FileUploadSubtext>
                Click to select a new photo (JPG, PNG, max 5MB)
              </FileUploadSubtext>
            </label>
          </FileUploadArea>
        </FileUploadContainer>
      </AvatarContainer>

      <FormRow>
        <FormGroup>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            placeholder="Enter your first name"
            value={profile.firstName || ''}
            onChange={handleChange}
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Enter your last name"
            value={profile.lastName || ''}
            onChange={handleChange}
          />
        </FormGroup>
      </FormRow>

      <FormRow>
        <FormGroup>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={profile.email || ''}
            onChange={handleChange}
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            placeholder="Enter your phone number"
            value={profile.phoneNumber || ''}
            onChange={handleChange}
          />
        </FormGroup>
      </FormRow>

      {/* Personal Information Section */}
      {profile.birthDate && (
        <FormRow>
          <FormGroup>
            <Label htmlFor="birthDate">Date of Birth</Label>
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
            <Label htmlFor="sex">Gender</Label>
            <Input
              id="sex"
              name="sex"
              placeholder="Gender"
              value={profile.sex || ''}
              onChange={handleChange}
              readOnly
            />
          </FormGroup>
        </FormRow>
      )}

      <FormGroup>
        <Label htmlFor="streetAddress">Street Address</Label>
        <Input
          id="streetAddress"
          name="streetAddress"
          placeholder="Enter your street address"
          value={profile.streetAddress || ''}
          onChange={handleChange}
        />
      </FormGroup>

      <FormRow>
        <FormGroup>
          <Label htmlFor="cityName">City</Label>
          <Input
            id="cityName"
            name="cityName"
            placeholder="Enter your city"
            value={profile.cityName || ''}
            onChange={handleChange}
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="stateName">State/Province</Label>
          <Input
            id="stateName"
            name="stateName"
            placeholder="Enter your state/province"
            value={profile.stateName || ''}
            onChange={handleChange}
          />
        </FormGroup>
      </FormRow>

      <FormRow>
        <FormGroup>
          <Label htmlFor="zipCode">Zip Code</Label>
          <Input
            id="zipCode"
            name="zipCode"
            placeholder="Enter your zip code"
            value={profile.zipCode || ''}
            onChange={handleChange}
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="countryName">Country</Label>
          <Input
            id="countryName"
            name="countryName"
            placeholder="Enter your country"
            value={profile.countryName || ''}
            onChange={handleChange}
          />
        </FormGroup>
      </FormRow>

      <FormGroup>
        <Label htmlFor="bio">Bio</Label>
        <TextArea
          id="bio"
          name="bio"
          placeholder="Tell us about yourself..."
          value={profile.bio || ''}
          onChange={handleChange}
        />
      </FormGroup>

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? <LoadingIcon /> : <SaveIcon />}
        {loading ? 'Updating...' : 'Update Profile'}
      </Button>
    </FormContainer>
  );
}

import React, { useState, useEffect, useContext } from 'react';
import axios from '../axiosConfig';
import { AuthContext } from '../Auth/AuthContext';
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
} from './components/CommonComponents';

export default function PersonalInfo({ userId }) {
  const [profile, setProfile] = useState({
    FirstName: '',
    LastName: '',
    Email: '',
    PhoneNumber: '',
    Bio: '',
    StreetAddress: '',
    CityName: '',
    ZipCode: '',
    CountryName: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { userProfilePhotoUrl, setUserProfilePhotoUrl, userType } = useContext(AuthContext);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;

    try {
      const response = await axios.get(`/api/v1/user/${userId}`, {
        params: {
          userType: userType,
          userId: userId,
        }
      });
      setProfile(response.data);
    } catch (error) {
      setError('Failed to load profile information');
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    formData.append('FirstName', profile.FirstName);
    formData.append('LastName', profile.LastName);
    formData.append('Email', profile.Email);
    formData.append('PhoneNumber', profile.PhoneNumber);
    formData.append('Bio', profile.Bio);
    formData.append('CityName', profile.CityName);
    formData.append('ZipCode', profile.ZipCode);
    formData.append('CountryName', profile.CountryName);
    formData.append('StreetAddress', profile.StreetAddress);
    if (selectedFile) {
      formData.append('profilePhoto', selectedFile);
    }

    try {
      const response = await axios.put(
        `/api/v1/user/profile/${userId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          params: {
            userType: userType,
          },
        }
      );
      setSuccess(true);
      if (response.data.userProfilePhotoUrl) {
        setUserProfilePhotoUrl(response.data.userProfilePhotoUrl);
      }
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError('Error updating profile. Please try again.');
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
        {userProfilePhotoUrl ? (
          <Avatar
            src={userProfilePhotoUrl}
            alt={`${profile.FirstName} ${profile.LastName}`}
          />
        ) : (
          <AvatarPlaceholder>
            {getInitials(profile.FirstName, profile.LastName)}
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
          <Label htmlFor="FirstName">First Name</Label>
          <Input
            id="FirstName"
            name="FirstName"
            placeholder="Enter your first name"
            value={profile.FirstName || ''}
            onChange={handleChange}
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="LastName">Last Name</Label>
          <Input
            id="LastName"
            name="LastName"
            placeholder="Enter your last name"
            value={profile.LastName || ''}
            onChange={handleChange}
          />
        </FormGroup>
      </FormRow>

      <FormRow>
        <FormGroup>
          <Label htmlFor="Email">Email Address</Label>
          <Input
            id="Email"
            name="Email"
            type="email"
            placeholder="Enter your email"
            value={profile.Email || ''}
            onChange={handleChange}
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="PhoneNumber">Phone Number</Label>
          <Input
            id="PhoneNumber"
            name="PhoneNumber"
            type="tel"
            placeholder="Enter your phone number"
            value={profile.PhoneNumber || ''}
            onChange={handleChange}
          />
        </FormGroup>
      </FormRow>

      <FormGroup>
        <Label htmlFor="StreetAddress">Street Address</Label>
        <Input
          id="StreetAddress"
          name="StreetAddress"
          placeholder="Enter your street address"
          value={profile.StreetAddress || ''}
          onChange={handleChange}
        />
      </FormGroup>

      <FormRow>
        <FormGroup>
          <Label htmlFor="CityName">City</Label>
          <Input
            id="CityName"
            name="CityName"
            placeholder="Enter your city"
            value={profile.CityName || ''}
            onChange={handleChange}
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="ZipCode">Zip Code</Label>
          <Input
            id="ZipCode"
            name="ZipCode"
            placeholder="Enter your zip code"
            value={profile.ZipCode || ''}
            onChange={handleChange}
          />
        </FormGroup>
      </FormRow>

      <FormGroup>
        <Label htmlFor="CountryName">Country</Label>
        <Input
          id="CountryName"
          name="CountryName"
          placeholder="Enter your country"
          value={profile.CountryName || ''}
          onChange={handleChange}
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="Bio">Bio</Label>
        <TextArea
          id="Bio"
          name="Bio"
          placeholder="Tell us about yourself..."
          value={profile.Bio || ''}
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

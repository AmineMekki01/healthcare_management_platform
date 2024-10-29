// PersonalInfo.js
import React, { useState, useEffect, useContext } from 'react';
import axios from './../axiosConfig';
import { CircularProgress } from '@mui/material';
import styled from 'styled-components';
import { AuthContext } from '../Auth/AuthContext';

const Container = styled.div`
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 10px;
  max-width: 800px;
  margin: auto;
`;

const ProfileAvatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 20px;
`;

const FileInput = styled.input`
  margin-bottom: 20px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;

const FormField = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  margin-bottom: 20px;
  box-sizing: border-box;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  resize: vertical;
  margin-bottom: 20px;
  box-sizing: border-box;
`;

const SubmitButton = styled.button`
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #6dc8b7;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #5ab3a1;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled(CircularProgress)`
  margin-left: 10px;
`;

const ErrorText = styled.div`
  color: red;
  margin-top: 10px;
`;

const SuccessText = styled.div`
  color: green;
  margin-top: 10px;
`;

export default function PersonalInfo({ userId }) {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    email: '',
    phone: '',
    profilePhotoUrl: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { userProfilePhotoUrl, setUserProfilePhotoUrl, userType } = useContext(AuthContext);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        const response = await axios.get(`/api/v1/user/${userId}`, {params : {
          userType : userType,
          userId : userId,
        }});
        setProfile(response.data);
        console.log("response:", response.data)
      } catch (error) {
        setError('Failed to load profile information');
      }
    };
    fetchProfile();
  }, [userId]);

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
    formData.append('Bio', profile.PatientBio);
    formData.append('CityName', profile.CityName);
    formData.append('ZipCode', profile.ZipCode);
    formData.append('CountryName', profile.CountryName);
    formData.append('StreetAddress', profile.PhoneNumber);
    formData.append('profilePhoto', selectedFile);

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
      setUserProfilePhotoUrl(response.data.userProfilePhotoUrl)
    } catch (error) {
      setError('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div style={{ textAlign: 'center' }}>
        <ProfileAvatar
          src={userProfilePhotoUrl}
          alt={`${profile.firstName} ${profile.lastName}`}
        />

      </div>
      <FileInput type="file" accept="image/*" onChange={handleFileChange} />


      <FormGrid>
        <FormField
          name="FirstName"
          placeholder="First Name"
          value={profile.FirstName}
          onChange={handleChange}
        />
        <FormField
          name="LastName"
          placeholder="Last Name"
          value={profile.LastName}
          onChange={handleChange}
        />
      </FormGrid>


        <FormField
        name="Email"
        placeholder="Email"
        value={profile.Email}
        onChange={handleChange}
      />


        <FormField
        name="StreetAddress"
        placeholder="Street Address"
        value={profile.StreetAddress}
        onChange={handleChange}
      />
      
      <FormField
        name="CityName"
        placeholder="City Name"
        value={profile.CityName}
        onChange={handleChange}
      />
      
      <FormField
        name="ZipCode"
        placeholder="Zip Code"
        value={profile.ZipCode}
        onChange={handleChange}
      />
    
    <FormField
        name="CountryName"
        placeholder="Country Name"
        value={profile.CountryName}
        onChange={handleChange}
      />


      <FormField
        name="PhoneNumber"
        placeholder="Phone Number"
        value={profile.PhoneNumber}
        onChange={handleChange}
      />

    <TextArea
        name="Bio"
        placeholder="Bio"
        rows="3"
        value={profile.Bio}
        onChange={handleChange}
      />

      {error && <ErrorText>{error}</ErrorText>}
      {success && <SuccessText>Profile updated successfully!</SuccessText>}

      <SubmitButton onClick={handleSubmit} disabled={loading}>
        Update Profile
        {loading && <LoadingSpinner size={24} />}
      </SubmitButton>
    </Container>
  );
}

import React, { useState, useEffect } from 'react';
import axios from './../axiosConfig';
import {
  SettingsContainer,
  SectionTitle,
  Card,
  DoctorName,
  UnfollowButton,
  NoDoctorsMessage,
} from './styles/SettingsStyles';

export default function DoctorFollowSettings({ userId }) {
  const [followedDoctors, setFollowedDoctors] = useState([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get(`/api/v1/patient-followings/${userId}`);
        setFollowedDoctors(response.data.following_users || []);
      } catch (error) {
        console.error('Error fetching followed doctors:', error);
      }
    };
    fetchDoctors();
  }, [userId]);

  const unfollowDoctor = async (doctorId) => {
    try {
      await axios.delete(`/api/v1/unfollow-doctor`, {
        params: {
          userId,
          doctorId,
        },
      });
      setFollowedDoctors(followedDoctors.filter(doc => doc.DoctorId !== doctorId));
    } catch (error) {
      console.error('Error unfollowing doctor:', error);
    }
  };

  return (
    <SettingsContainer>
      <SectionTitle>Doctors You Follow</SectionTitle>
      {followedDoctors.length === 0 ? (
        <NoDoctorsMessage>You are not following any doctors yet.</NoDoctorsMessage>
      ) : (
        followedDoctors.map(doctor => (
          <Card key={doctor.DoctorId}>
            <DoctorName>
              {doctor.FirstName} {doctor.LastName}
            </DoctorName>
            <UnfollowButton onClick={() => unfollowDoctor(doctor.DoctorId)}>
              Unfollow
            </UnfollowButton>
          </Card>
        ))
      )}
    </SettingsContainer>
  );
}

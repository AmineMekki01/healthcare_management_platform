import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DoctorCard,
  DoctorInfo,
  DoctorName,
  DoctorAvatar,
  DoctorSpecialty,
  UnfollowButton,
  NoDoctorsMessage,
  LoadingContainer,
  ErrorMessage,
  SuccessMessage,
  ConfirmationDialog,
  ConfirmationContent,
  ConfirmationButtons,
  ConfirmButton,
  CancelButton,
} from '../styles/settingsStyles';
import { settingsService } from '../services/settingsService';

const UnfollowIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 6.5V8.5L21 9ZM12 7C12.39 7 12.72 6.95 13 6.9V10.1C12.72 10.05 12.39 10 12 10S11.28 10.05 11 10.1V6.9C11.28 6.95 11.61 7 12 7ZM11 16C11 15.71 11.05 15.39 11.1 15.1H6.9C6.95 15.39 7 15.71 7 16C7 16.29 6.95 16.61 6.9 16.9H11.1C11.05 16.61 11 16.29 11 16ZM12 18C13.1 18 14 17.1 14 16C14 14.9 13.1 14 12 14C10.9 14 10 14.9 10 16C10 17.1 10.9 18 12 18Z"/>
  </svg>
);

const ErrorIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
    <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
  </svg>
);

const SuccessIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/>
  </svg>
);

const ExploreIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
    <path d="M12,2L13.09,8.26L22,9L13.09,15.74L12,22L10.91,15.74L2,9L10.91,8.26L12,2Z"/>
  </svg>
);

export default function DoctorFollowSettings({ userId }) {
  const { t } = useTranslation('settings');
  const [followedDoctors, setFollowedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [unfollowingId, setUnfollowingId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, doctor: null });

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await settingsService.getFollowedDoctors(userId);
      console.log('Followed doctors:', data);
      setFollowedDoctors(data || []);
    } catch (error) {
      console.error('Error fetching followed doctors:', error);
      setError(t('followedDoctors.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleUnfollowClick = (doctor) => {
    setConfirmDialog({ show: true, doctor });
  };

  const confirmUnfollow = async () => {
    const { doctor } = confirmDialog;
    if (!doctor) return;

    try {
      setUnfollowingId(doctor.doctorId);
      setError('');
      
      await settingsService.unfollowDoctor(userId, doctor.doctorId);
      
      setFollowedDoctors(followedDoctors.filter(doc => doc.doctorId !== doctor.doctorId));
      setSuccess(t('followedDoctors.success.unfollowed', { doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}` }));

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error unfollowing doctor:', error);
      setError(t('followedDoctors.errors.unfollowFailed'));
    } finally {
      setUnfollowingId(null);
      setConfirmDialog({ show: false, doctor: null });
    }
  };

  const cancelUnfollow = () => {
    setConfirmDialog({ show: false, doctor: null });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <LoadingContainer>
        <div className="spinner"></div>
      </LoadingContainer>
    );
  }

  return (
    <>
      {error && (
        <ErrorMessage>
          <ErrorIcon />
          {error}
        </ErrorMessage>
      )}
      
      {success && (
        <SuccessMessage>
          <SuccessIcon />
          {success}
        </SuccessMessage>
      )}

      {followedDoctors.length === 0 ? (
        <NoDoctorsMessage>
          <ExploreIcon />
          <h3>{t('followedDoctors.noDoctors.title')}</h3>
          <p>
            {t('followedDoctors.noDoctors.description')}
          </p>
        </NoDoctorsMessage>
      ) : (
        <>
          {followedDoctors.map(doctor => (
            <DoctorCard key={doctor.doctorId}>
              <DoctorInfo>
                <DoctorName>
                  <DoctorAvatar>
                    {getInitials(doctor.firstName, doctor.lastName)}
                  </DoctorAvatar>
                  <div>
                    <div>Dr. {doctor.firstName} {doctor.lastName}</div>
                    <DoctorSpecialty>
                      {doctor.specialty || 'Null'}
                    </DoctorSpecialty>
                  </div>
                </DoctorName>
              </DoctorInfo>
              <UnfollowButton
                onClick={() => handleUnfollowClick(doctor)}
                disabled={unfollowingId === doctor.doctorId}
              >
                {unfollowingId === doctor.doctorId ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                    {t('followedDoctors.buttons.unfollowing')}
                  </>
                ) : (
                  <>
                    <UnfollowIcon />
                    {t('followedDoctors.buttons.unfollow')}
                  </>
                )}
              </UnfollowButton>
            </DoctorCard>
          ))}
        </>
      )}

      {confirmDialog.show && (
        <ConfirmationDialog>
          <ConfirmationContent>
            <h3>{t('followedDoctors.confirmDialog.title')}</h3>
            <p>
              {t('followedDoctors.confirmDialog.message', { doctorName: `Dr. ${confirmDialog.doctor?.firstName} ${confirmDialog.doctor?.lastName}` })}
            </p>
            <ConfirmationButtons>
              <ConfirmButton onClick={confirmUnfollow}>
                {t('followedDoctors.buttons.yesUnfollow')}
              </ConfirmButton>
              <CancelButton onClick={cancelUnfollow}>
                {t('followedDoctors.buttons.cancel')}
              </CancelButton>
            </ConfirmationButtons>
          </ConfirmationContent>
        </ConfirmationDialog>
      )}
    </>
  );
}

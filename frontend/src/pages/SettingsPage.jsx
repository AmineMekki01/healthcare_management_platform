import React, { useContext, useState } from 'react';
import PersonalInfo from '../components/Settings/PersonalInfo';
import DoctorFollowSettings from './../components/Settings/DoctorFollowSettings';
import DoctorAdditionalInfo from './../components/Settings/DoctorAdditionalInfo';

import { AuthContext } from './../components/Auth/AuthContext';
import {
  SettingsContainer,
  SettingsHeader,
  SettingsTitle,
  SettingsSubtitle,
  SectionTitle,
  NavigationContainer,
  NavigationButton,
  ContentContainer,
} from './../components/Settings/styles/SettingsStyles';

const UserIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 6.5V8.5L21 9ZM12 7C12.39 7 12.72 6.95 13 6.9V10.1C12.72 10.05 12.39 10 12 10S11.28 10.05 11 10.1V6.9C11.28 6.95 11.61 7 12 7ZM11 16C11 15.71 11.05 15.39 11.1 15.1H6.9C6.95 15.39 7 15.71 7 16C7 16.29 6.95 16.61 6.9 16.9H11.1C11.05 16.61 11 16.29 11 16ZM12 18C13.1 18 14 17.1 14 16C14 14.9 13.1 14 12 14C10.9 14 10 14.9 10 16C10 17.1 10.9 18 12 18Z"/>
  </svg>
);

const HeartIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
    <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"/>
  </svg>
);

const MedicalIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
    <path d="M19,8L15,12H17A5,5 0 0,1 12,17A5,5 0 0,1 7,12H9L5,8H7A7,7 0 0,1 14,1A7,7 0 0,1 21,8H19M12,2.5A3.5,3.5 0 0,0 8.5,6A3.5,3.5 0 0,0 12,9.5A3.5,3.5 0 0,0 15.5,6A3.5,3.5 0 0,0 12,2.5Z"/>
  </svg>
);

const SecurityIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11C15.4,11 16,11.4 16,12V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V12C8,11.4 8.4,11 9,11V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z"/>
  </svg>
);

const NotificationIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
    <path d="M12,2A2,2 0 0,1 14,4V5.5A6.5,6.5 0 0,1 20.5,12A6.5,6.5 0 0,1 14,18.5V20A2,2 0 0,1 12,22A2,2 0 0,1 10,20V18.5A6.5,6.5 0 0,1 3.5,12A6.5,6.5 0 0,1 10,5.5V4A2,2 0 0,1 12,2M12,4A1,1 0 0,0 11,5V6A1,1 0 0,0 12,7A1,1 0 0,0 13,6V5A1,1 0 0,0 12,4M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
  </svg>
);

export default function SettingsPage() {
  const { userId, userType } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('personal');

  const navigationItems = [
    {
      id: 'personal',
      label: 'Personal Information',
      icon: <UserIcon />,
      available: true,
    },
    {
      id: 'doctors',
      label: 'Follow Settings',
      icon: <HeartIcon />,
      available: true,
    },
    {
      id: 'additionalDoctorsInfo',
      label: 'Professional Info',
      icon: <MedicalIcon />,
      available: userType === 'doctor',
    },
  ];

  const getSectionTitle = (sectionId) => {
    switch (sectionId) {
      case 'personal':
        return 'Personal Information';
      case 'doctors':
        return 'Doctors I Follow';
      case 'additionalDoctorsInfo':
        return 'Professional Information';
      default:
        return 'Settings';
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'personal':
        return <PersonalInfo userId={userId} userType={userType} />;
      case 'doctors':
        return <DoctorFollowSettings userId={userId} />;
      case 'additionalDoctorsInfo':
        return userType === 'doctor' ? <DoctorAdditionalInfo userId={userId} /> : null;
      default:
        return null;
    }
  };

  return (
    <SettingsContainer>
      
      <SettingsHeader>
        <SettingsTitle>Settings</SettingsTitle>
        <SettingsSubtitle>Manage your account preferences and information</SettingsSubtitle>
      </SettingsHeader>

      <NavigationContainer>
        {navigationItems
          .filter(item => item.available)
          .map(item => (
            <NavigationButton
              key={item.id}
              active={activeSection === item.id}
              onClick={() => setActiveSection(item.id)}
            >
              {item.icon}
              {item.label}
            </NavigationButton>
          ))}
      </NavigationContainer>

      <ContentContainer>
        <SectionTitle>{getSectionTitle(activeSection)}</SectionTitle>
        {renderContent()}
      </ContentContainer>
    </SettingsContainer>
  );
}

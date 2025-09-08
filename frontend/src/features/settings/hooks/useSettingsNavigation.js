import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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

const CalendarIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
    <path d="M19,3H17V1H15V3H9V1H7V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19M12,10A1.5,1.5 0 0,1 13.5,11.5A1.5,1.5 0 0,1 12,13A1.5,1.5 0 0,1 10.5,11.5A1.5,1.5 0 0,1 12,10M16.5,11.5A1.5,1.5 0 0,1 18,13A1.5,1.5 0 0,1 16.5,14.5A1.5,1.5 0 0,1 15,13A1.5,1.5 0 0,1 16.5,11.5M7.5,11.5A1.5,1.5 0 0,1 9,13A1.5,1.5 0 0,1 7.5,14.5A1.5,1.5 0 0,1 6,13A1.5,1.5 0 0,1 7.5,11.5Z"/>  
  </svg>
);

/**
 * Custom hook for managing settings navigation state and configuration
 * @param {string} userType - The type of user ('doctor', 'patient', etc.)
 * @returns {Object} - Navigation state and utilities
 */
export const useSettingsNavigation = (userType) => {
  const { t } = useTranslation('settings');
  const [activeSection, setActiveSection] = useState('personal');

  const navigationItems = [
    {
      id: 'personal',
      label: t('navigation.personal'),
      icon: <UserIcon />,
      available: true,
    },
    {
      id: 'doctors',
      label: t('navigation.followSettings'),
      icon: <HeartIcon />,
      available: true,
    },
    {
      id: 'availability',
      label: t('navigation.availability'),
      icon: <CalendarIcon />,
      available: userType === 'doctor',
    },
    {
      id: 'additionalDoctorsInfo',
      label: t('navigation.professionalInfo'),
      icon: <MedicalIcon />,
      available: userType === 'doctor',
    },
  ];

  const getSectionTitle = (sectionId) => {
    switch (sectionId) {
      case 'personal':
        return t('navigation.personal');
      case 'doctors':
        return t('navigation.followedDoctors');
      case 'additionalDoctorsInfo':
        return t('navigation.professionalInfo');
      case 'availability':
        return t('navigation.availability');
      default:
        return t('page.title');
    }
  };

  return {
    activeSection,
    setActiveSection,
    navigationItems: navigationItems.filter(item => item.available),
    getSectionTitle
  };
};

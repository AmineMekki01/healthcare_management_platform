import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from './../../../features/auth/context/AuthContext';
import { useSettingsNavigation } from '../hooks/useSettingsNavigation';
import SettingsNavigation from '../components/SettingsNavigation';
import PersonalInfo from '../components/PersonalInfo';
import DoctorFollowSettings from '../components/DoctorFollowSettings';
import DoctorAdditionalInfo from '../components/DoctorAdditionalInfo';
import DoctorAvailabilitySettings from '../components/DoctorAvailabilitySettings';
import {
  SettingsContainer,
  SettingsHeader,
  SettingsTitle,
  SettingsSubtitle,
  SectionTitle,
  ContentContainer,
} from '../styles/settingsStyles';

const SettingsPage = () => {
  const { t } = useTranslation(['settings', 'common']);
  const { userId, userType } = useContext(AuthContext);
  
  const {
    activeSection,
    setActiveSection,
    navigationItems,
    getSectionTitle
  } = useSettingsNavigation(userType);

  const renderContent = () => {
    switch (activeSection) {
      case 'personal':
        return <PersonalInfo userId={userId} userType={userType} />;
      case 'doctors':
        return <DoctorFollowSettings userId={userId} />;
      case 'availability':
        return <DoctorAvailabilitySettings />;
      case 'additionalDoctorsInfo':
        return userType === 'doctor' ? <DoctorAdditionalInfo userId={userId} /> : null;
      default:
        return null;
    }
  };

  return (
    <SettingsContainer>
      <SettingsHeader>
        <SettingsTitle>{t('settings:page.title')}</SettingsTitle>
        <SettingsSubtitle>{t('settings:page.subtitle')}</SettingsSubtitle>
      </SettingsHeader>

      <SettingsNavigation
        navigationItems={navigationItems}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <ContentContainer>
        <SectionTitle>{getSectionTitle(activeSection)}</SectionTitle>
        {renderContent()}
      </ContentContainer>
    </SettingsContainer>
  );
};

export default SettingsPage;

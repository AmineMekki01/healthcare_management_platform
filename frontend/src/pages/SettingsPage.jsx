import React, { useContext, useState } from 'react';
import PersonalInfo from '../components/Settings/PersonalInfo';
import DoctorFollowSettings from './../components/Settings/DoctorFollowSettings';
import DoctorAdditionalInfo from './../components/Settings/DoctorAdditionalInfo';

import { AuthContext } from './../components/Auth/AuthContext';
import { SettingsContainer, SectionTitle, SectionContainer } from './../components/Settings/styles/SettingsStyles';

export default function SettingsPage() {
  const { userId, userType } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('personal');

  return (
    <SettingsContainer>
      <SectionContainer>
        <button onClick={() => setActiveSection('personal')}>Personal Information</button>
        <button onClick={() => setActiveSection('doctors')}>Follow Settings</button>
        {userType === 'doctor' && (
          <button onClick={() => setActiveSection('additionalDoctorsInfo')}>Additional Doctors Info</button>
        )}
      </SectionContainer>

      {activeSection === 'personal' && (
        <>
          <SectionTitle>Personal Information</SectionTitle>
          <PersonalInfo userId={userId} userType={userType} />
        </>
      )}

      {activeSection === 'doctors' && (
        <>
          <SectionTitle>Doctors I Follow</SectionTitle>
          <DoctorFollowSettings userId={userId} />
        </>
      )}
      {activeSection === 'additionalDoctorsInfo' && userType === 'doctor' && (
        <>
          <SectionTitle>Additional Doctor Info</SectionTitle>
          <DoctorAdditionalInfo userId={userId} />
        </>
      )}
    </SettingsContainer>
  );
}

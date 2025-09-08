import React from 'react';
import { useTranslation } from 'react-i18next';
import { TabContainer, Tab } from '../styles/appointmentStyles';

const AppointmentTabs = ({ tabs, activeTab, onTabChange }) => {
  const { t } = useTranslation('appointments');
  
  return (
    <TabContainer>
      {tabs.map(tab => (
        <Tab
          key={tab.id}
          $active={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        >
          {t(`tabs.${tab.id}`) || tab.label} {tab.count > 0 && `(${tab.count})`}
        </Tab>
      ))}
    </TabContainer>
  );
};

export default AppointmentTabs;

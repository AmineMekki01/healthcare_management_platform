import React from 'react';
import { TabContainer, Tab } from '../styles/appointmentStyles';

const AppointmentTabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <TabContainer>
      {tabs.map(tab => (
        <Tab
          key={tab.id}
          $active={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label} {tab.count > 0 && `(${tab.count})`}
        </Tab>
      ))}
    </TabContainer>
  );
};

export default AppointmentTabs;

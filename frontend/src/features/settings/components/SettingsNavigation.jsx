import React from 'react';
import { NavigationContainer, NavigationButton } from '../styles/settingsStyles';

const SettingsNavigation = ({ navigationItems, activeSection, onSectionChange }) => {
  return (
    <NavigationContainer>
      {navigationItems.map(item => (
        <NavigationButton
          key={item.id}
          active={activeSection === item.id}
          onClick={() => onSectionChange(item.id)}
        >
          {item.icon}
          {item.label}
        </NavigationButton>
      ))}
    </NavigationContainer>
  );
};

export default SettingsNavigation;

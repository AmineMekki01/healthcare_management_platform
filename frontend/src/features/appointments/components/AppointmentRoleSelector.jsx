import React from 'react';
import { RoleSelector, RoleButton } from '../styles/appointmentStyles';

const AppointmentRoleSelector = ({ selectedRole, onRoleChange }) => {
  return (
    <RoleSelector>
      <RoleButton 
        $active={selectedRole === 'doctor'}
        onClick={() => onRoleChange('doctor')}
      >
        👨‍⚕️ My Appointments as Doctor
      </RoleButton>
      <RoleButton 
        $active={selectedRole === 'patient'}
        onClick={() => onRoleChange('patient')}
      >
        🏥 My Appointments as Patient
      </RoleButton>
    </RoleSelector>
  );
};

export default AppointmentRoleSelector;

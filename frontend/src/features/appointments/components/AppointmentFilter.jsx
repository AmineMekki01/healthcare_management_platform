import React from 'react';
import { FilterContainer, FilterInput } from '../styles/appointmentStyles';

const AppointmentFilter = ({ 
  filterText, 
  onFilterChange, 
  placeholder = "🔍 Search by doctor or patient name..." 
}) => {
  return (
    <FilterContainer>
      <FilterInput
        type="text"
        placeholder={placeholder}
        value={filterText}
        onChange={(e) => onFilterChange(e.target.value)}
      />
    </FilterContainer>
  );
};

export default AppointmentFilter;

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FilterContainer, FilterInput } from '../styles/appointmentStyles';

const AppointmentFilter = ({ 
  filterText, 
  onFilterChange, 
  placeholder 
}) => {
  const { t } = useTranslation('appointments');
  
  return (
    <FilterContainer>
      <FilterInput
        type="text"
        placeholder={placeholder || t('filter.searchPlaceholder')}
        value={filterText}
        onChange={(e) => onFilterChange(e.target.value)}
      />
    </FilterContainer>
  );
};

export default AppointmentFilter;

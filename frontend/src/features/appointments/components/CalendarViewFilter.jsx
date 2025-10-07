import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Cancel, Schedule } from '@mui/icons-material';
import styled from 'styled-components';

const FilterContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border: 2px solid ${props => {
    switch(props.$type) {
      case 'upcoming': return props.$active ? '#48bb78' : '#e2e8f0';
      case 'passed': return props.$active ? '#ed8936' : '#e2e8f0';
      case 'canceled': return props.$active ? '#f56565' : '#e2e8f0';
      default: return '#e2e8f0';
    }
  }};
  background: ${props => {
    if (!props.$active) return 'white';
    switch(props.$type) {
      case 'upcoming': return 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
      case 'passed': return 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)';
      case 'canceled': return 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)';
      default: return 'white';
    }
  }};
  color: ${props => props.$active ? 'white' : '#4a5568'};
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  svg {
    font-size: 1.2rem;
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    
    svg {
      font-size: 1rem;
    }
  }
`;

const CalendarViewFilter = ({ filters, onFilterChange }) => {
  const { t } = useTranslation('appointments');

  const toggleFilter = (filterType) => {
    onFilterChange({
      ...filters,
      [filterType]: !filters[filterType]
    });
  };

  return (
    <FilterContainer>
      <FilterButton
        $type="upcoming"
        $active={filters.showUpcoming}
        onClick={() => toggleFilter('showUpcoming')}
      >
        <Schedule />
        {t('calendar.filters.upcoming')}
      </FilterButton>
      
      <FilterButton
        $type="passed"
        $active={filters.showPassed}
        onClick={() => toggleFilter('showPassed')}
      >
        <CheckCircle />
        {t('calendar.filters.passed')}
      </FilterButton>
      
      <FilterButton
        $type="canceled"
        $active={filters.showCanceled}
        onClick={() => toggleFilter('showCanceled')}
      >
        <Cancel />
        {t('calendar.filters.canceled')}
      </FilterButton>
    </FilterContainer>
  );
};

export default CalendarViewFilter;

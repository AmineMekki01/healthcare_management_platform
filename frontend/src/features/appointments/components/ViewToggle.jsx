import React from 'react';
import { useTranslation } from 'react-i18next';
import { ViewList, CalendarMonth } from '@mui/icons-material';
import { ViewToggleContainer, ViewToggleButton } from '../styles/calendarStyles';

const ViewToggle = ({ view, onViewChange }) => {
  const { t } = useTranslation('appointments');

  return (
    <ViewToggleContainer>
      <ViewToggleButton
        $active={view === 'grid'}
        onClick={() => onViewChange('grid')}
      >
        <ViewList />
        {t('calendar.gridView')}
      </ViewToggleButton>
      <ViewToggleButton
        $active={view === 'calendar'}
        onClick={() => onViewChange('calendar')}
      >
        <CalendarMonth />
        {t('calendar.calendarView')}
      </ViewToggleButton>
    </ViewToggleContainer>
  );
};

export default ViewToggle;

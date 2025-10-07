import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Person, 
  AccessTime, 
  MedicalServices,
  Cancel as CancelIcon 
} from '@mui/icons-material';
import {
  CalendarContainer,
  CalendarHeader,
  WeekNavigator,
  NavButton,
  CurrentWeekLabel,
  TodayButton,
  CalendarGrid,
  TimeColumn,
  TimeSlot,
  DaysHeader,
  DayHeader,
  DayColumn,
  AppointmentBlock,
  AppointmentContent,
  AppointmentTitle,
  AppointmentTime,
  AppointmentInfo,
  EmptyDayMessage
} from '../styles/calendarStyles';
import CancelAppointmentModal from './CancelAppointmentModal';
import CalendarViewFilter from './CalendarViewFilter';
import appointmentService from '../services/appointmentService';

const WeeklyCalendarView = ({ 
  appointments, 
  userType, 
  activeMode,
  onAppointmentUpdate 
}) => {
  const { t } = useTranslation('appointments');
  const navigate = useNavigate();
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [calendarFilters, setCalendarFilters] = useState({
    showUpcoming: true,
    showPassed: true,
    showCanceled: true
  });

  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6 ; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentWeekStart]);

  const weekAppointments = useMemo(() => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 7);
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentStart);
      const isInWeek = aptDate >= currentWeekStart && aptDate < weekEnd;
      
      if (!isInWeek) return false;
      
      const isPast = new Date(apt.appointmentEnd) < new Date();
      const isCanceled = apt.canceled;
      const isUpcoming = !isPast && !isCanceled;
      
      if (isCanceled && !calendarFilters.showCanceled) return false;
      if (isPast && !isCanceled && !calendarFilters.showPassed) return false;
      if (isUpcoming && !calendarFilters.showUpcoming) return false;
      
      return true;
    });
  }, [appointments, currentWeekStart, calendarFilters]);

  const appointmentsOverlap = (apt1, apt2) => {
    const start1 = new Date(apt1.appointmentStart);
    const end1 = new Date(apt1.appointmentEnd);
    const start2 = new Date(apt2.appointmentStart);
    const end2 = new Date(apt2.appointmentEnd);
    
    return start1 < end2 && start2 < end1;
  };

  const appointmentsByDay = useMemo(() => {
    const grouped = {};
    weekDays.forEach((day, index) => {
      const dayAppointments = weekAppointments.filter(apt => {
        const aptDate = new Date(apt.appointmentStart);
        return aptDate.toDateString() === day.toDateString();
      });
      
      dayAppointments.forEach((apt, i) => {
        apt.overlaps = [];
        dayAppointments.forEach((otherApt, j) => {
          if (i !== j && appointmentsOverlap(apt, otherApt)) {
            apt.overlaps.push(otherApt);
          }
        });
      });
      
      grouped[index] = dayAppointments;
    });
    return grouped;
  }, [weekAppointments, weekDays]);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  const formatDate = (date) => {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const formatWeekRange = () => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    return `${formatDate(currentWeekStart)} - ${formatDate(weekEnd)}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getDayName = (date) => {
    const dayIndex = date.getDay();
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return t(`calendar.days.${dayKeys[dayIndex]}`);
  };

  const getAppointmentStyle = (appointment) => {
    const start = new Date(appointment.appointmentStart);
    const end = new Date(appointment.appointmentEnd);
    
    const startHour = start.getHours();
    const startMinutes = start.getMinutes();
    const endHour = end.getHours();
    const endMinutes = end.getMinutes();
    
    const topOffset = ((startHour - 6) * 60 + startMinutes) / 60;
    const duration = ((endHour - startHour) * 60 + (endMinutes - startMinutes)) / 60;
    
    const style = {
      top: `${topOffset * 60}px`,
      height: `${Math.max(duration * 60, 30)}px`,
    };
    
    if (appointment.overlaps && appointment.overlaps.length > 0) {
      const isCanceled = appointment.canceled;
      const hasActiveOverlap = appointment.overlaps.some(apt => !apt.canceled);
      const hasCanceledOverlap = appointment.overlaps.some(apt => apt.canceled);
      
      if (isCanceled && hasActiveOverlap) {
        style.left = '4px';
        style.right = '52%';
        style.width = 'auto';
      }
      else if (!isCanceled && hasCanceledOverlap) {
        style.left = '52%';
        style.right = '4px';
        style.width = 'auto';
      }
      else {
        const overlapIndex = appointment.overlapIndex || 0;
        const totalOverlaps = appointment.totalOverlaps || 1;
        const widthPercent = 100 / totalOverlaps;
        style.left = `${overlapIndex * widthPercent}%`;
        style.width = `${widthPercent - 1}%`;
        style.right = 'auto';
      }
    }
    
    return style;
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getAppointmentStatus = (apt) => {
    if (apt.canceled) return 'canceled';
    if (new Date(apt.appointmentEnd) < new Date()) return 'passed';
    return 'active';
  };

  const handleAppointmentClick = (appointment, event) => {
    event.stopPropagation();
    const effectiveUserType = activeMode === 'patient' ? 'patient' : userType;
    if (effectiveUserType === 'patient') {
      navigate(`/doctor-profile/${appointment.doctorId}`);
    } else {
      navigate(`/patient-profile/${appointment.patientId}`);
    }
  };

  const handleCancelClick = (appointment, event) => {
    event.stopPropagation();
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCancelAppointment = async (reason) => {
    if (!selectedAppointment) return;
    
    try {
      await appointmentService.cancelAppointment(
        selectedAppointment.appointmentId,
        activeMode === 'patient' ? 'patient' : userType,
        reason
      );

      alert(t('card.cancelSuccess'));
      setShowCancelModal(false);
      setSelectedAppointment(null);
      
      if (onAppointmentUpdate) {
        onAppointmentUpdate();
      }
    } catch (error) {
      console.error('Error canceling appointment:', error);
      alert(t('card.cancelError'));
    }
  };

  return (
    <>
      <CalendarViewFilter 
        filters={calendarFilters}
        onFilterChange={setCalendarFilters}
      />
      
      <CalendarContainer>
        <CalendarHeader>
          <WeekNavigator>
            <NavButton onClick={goToPreviousWeek}>
              <ChevronLeft />
            </NavButton>
            <CurrentWeekLabel>{formatWeekRange()}</CurrentWeekLabel>
            <NavButton onClick={goToNextWeek}>
              <ChevronRight />
            </NavButton>
          </WeekNavigator>
          <TodayButton onClick={goToToday}>
            {t('calendar.today')}
          </TodayButton>
        </CalendarHeader>

        <CalendarGrid>
          <TimeColumn>
            <div style={{ height: '78px' }}></div>
            {timeSlots.map((time) => (
              <TimeSlot key={time}>{time}</TimeSlot>
            ))}
          </TimeColumn>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <DaysHeader>
              {weekDays.map((day, index) => (
                <DayHeader key={index} $isToday={isToday(day)}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    {getDayName(day)}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    {day.getDate()}
                  </div>
                </DayHeader>
              ))}
            </DaysHeader>

            <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
              {weekDays.map((day, dayIndex) => (
                <DayColumn key={dayIndex}>
                  {timeSlots.map((time, timeIndex) => (
                    <div
                      key={`${dayIndex}-${timeIndex}`}
                      style={{
                        height: '60px',
                        borderBottom: '1px solid #e2e8f0',
                        borderRight: dayIndex < 6 ? '1px solid #e2e8f0' : 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  ))}
                  
                  {appointmentsByDay[dayIndex]?.map((appointment) => {
                    const style = getAppointmentStyle(appointment);
                    const status = getAppointmentStatus(appointment);
                    const effectiveUserType = activeMode === 'patient' ? 'patient' : userType;
                    const isPast = new Date(appointment.appointmentEnd) < new Date();
                    const isCanceled = appointment.canceled;
                    
                    return (
                      <AppointmentBlock
                        key={appointment.appointmentId}
                        style={style}
                        $status={status}
                        onClick={(e) => handleAppointmentClick(appointment, e)}
                      >
                        <AppointmentContent>
                          <AppointmentTitle>
                            {effectiveUserType === 'patient' 
                              ? `Dr. ${appointment.doctorFirstName} ${appointment.doctorLastName}`
                              : `${appointment.patientFirstName} ${appointment.patientLastName}`
                            }
                          </AppointmentTitle>
                          <AppointmentTime>
                            <AccessTime style={{ fontSize: '0.8rem' }} />
                            {formatTime(appointment.appointmentStart)} - {formatTime(appointment.appointmentEnd)}
                          </AppointmentTime>
                          {effectiveUserType === 'patient' && (
                            <AppointmentInfo>
                              <MedicalServices style={{ fontSize: '0.8rem' }} />
                              {appointment.specialty}
                            </AppointmentInfo>
                          )}
                          {effectiveUserType === 'doctor' && (
                            <AppointmentInfo>
                              <Person style={{ fontSize: '0.8rem' }} />
                              {t('card.patientAge', { age: appointment.age })}
                            </AppointmentInfo>
                          )}
                          {!isPast && !isCanceled && (
                            <button
                              onClick={(e) => handleCancelClick(appointment, e)}
                              style={{
                                marginTop: '0.3rem',
                                padding: '0.2rem 0.5rem',
                                background: '#f56565',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                              }}
                            >
                              <CancelIcon style={{ fontSize: '0.8rem' }} />
                              {t('card.cancel')}
                            </button>
                          )}
                        </AppointmentContent>
                      </AppointmentBlock>
                    );
                  })}
                  
                  {appointmentsByDay[dayIndex]?.length === 0 && (
                    <EmptyDayMessage>
                      {t('calendar.noAppointments')}
                    </EmptyDayMessage>
                  )}
                </DayColumn>
              ))}
            </div>
          </div>
        </CalendarGrid>
      </CalendarContainer>

      <CancelAppointmentModal
        open={showCancelModal}
        handleClose={() => {
          setShowCancelModal(false);
          setSelectedAppointment(null);
        }}
        handleCancel={handleCancelAppointment}
      />
    </>
  );
};

export default WeeklyCalendarView;

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, 
  ChevronRight, 
  Person, 
  AccessTime, 
  MedicalServices,
  Cancel as CancelIcon,
  Block
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
import QuickScheduleModal from './QuickScheduleModal';
import PersonalEventModal from './PersonalEventModal';
import EventDetailsModal from './EventDetailsModal';
import appointmentService from '../services/appointmentService';
import calendarEventService from '../services/calendarEventService';
import receptionistPatientService from '../../receptionist/services/receptionistPatientService';
import {
  formatAppointmentTime,
  getDoctorPrefix,
  getLocalizedDoctorName,
  getLocalizedPatientName,
  getLocalizedSpecialtyLabel,
} from '../utils/appointmentI18n';

const WeeklyCalendarView = ({ 
  appointments, 
  userType,
  userId,
  assignedDoctorId,
  activeMode,
  onAppointmentUpdate 
}) => {
  const { t, i18n } = useTranslation('appointments');
  const { t: tMedical } = useTranslation('medical');
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showQuickSchedule, setShowQuickSchedule] = useState(false);
  const [showPersonalEvent, setShowPersonalEvent] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState({ date: null, time: null });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [calendarFilters, setCalendarFilters] = useState({
    showUpcoming: true,
    showPassed: true,
    showCanceled: true
  });

  const isRTL = i18n.language === 'ar';

  const isDoctorProviderMode = userType === 'doctor' && activeMode === 'doctor';
  const isReceptionistProviderMode = userType === 'receptionist' && activeMode === 'receptionist';
  const isProviderMode = isDoctorProviderMode || isReceptionistProviderMode;
  const effectiveDoctorId = isDoctorProviderMode ? userId : (isReceptionistProviderMode ? assignedDoctorId : null);

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

  const formatTimeSlotLabel = (time) => {
    const [hours, minutes] = String(time).split(':');
    const d = new Date();
    d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return formatAppointmentTime(d, i18n.language);
  };

  const getSlotTooltip = () => {
    if (isDoctorProviderMode) return t('calendar.tooltips.doctorProvider');
    if (isReceptionistProviderMode) return t('calendar.tooltips.receptionistProvider');
    return '';
  };

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

      const dayEvents = calendarEvents.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === day.toDateString();
      }).map(event => ({
        ...event,
        appointmentStart: event.startTime,
        appointmentEnd: event.endTime,
        isPersonalEvent: true,
        title: event.title,
        canceled: false
      }));

      const allItems = [...dayAppointments, ...dayEvents];
      
      allItems.forEach((item, i) => {
        item.overlaps = [];
        allItems.forEach((otherItem, j) => {
          if (i !== j && appointmentsOverlap(item, otherItem)) {
            item.overlaps.push(otherItem);
          }
        });
      });
      
      grouped[index] = allItems;
    });
    return grouped;
  }, [weekAppointments, weekDays, calendarEvents]);

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

  useEffect(() => {
    const fetchPatients = async () => {
      if (!isProviderMode || !effectiveDoctorId) {
        setPatients([]);
        return;
      }

      if (isDoctorProviderMode) {
        setLoadingPatients(true);
        try {
          const patientList = await appointmentService.fetchDoctorPatients(effectiveDoctorId);
          setPatients(patientList);
        } catch (error) {
          console.error('Error fetching patients:', error);
          setPatients([]);
        } finally {
          setLoadingPatients(false);
        }
      }

      if (isReceptionistProviderMode) {
        setLoadingPatients(true);
        try {
          const response = await receptionistPatientService.searchPatients({
            page: 1,
            page_size: 200,
            search_term: ''
          });
          setPatients(response?.data?.patients || []);
        } catch (error) {
          console.error('Error fetching patients:', error);
          setPatients([]);
        } finally {
          setLoadingPatients(false);
        }
      }
    };

    fetchPatients();
  }, [isProviderMode, isDoctorProviderMode, isReceptionistProviderMode, effectiveDoctorId]);

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      if (activeMode === 'doctor' && userId) {
        setLoadingEvents(true);
        try {
          const weekEnd = new Date(currentWeekStart);
          weekEnd.setDate(currentWeekStart.getDate() + 7);
          
          const startDate = currentWeekStart.toISOString().split('T')[0];
          const endDate = weekEnd.toISOString().split('T')[0];
          
          const response = await calendarEventService.getCalendarEvents(userId, startDate, endDate);
          setCalendarEvents(response.events || []);
        } catch (error) {
          console.error('Error fetching calendar events:', error);
          setCalendarEvents([]);
        } finally {
          setLoadingEvents(false);
        }
      }
    };

    fetchCalendarEvents();
  }, [activeMode, userId, currentWeekStart]);

  const getMonthName = (date) => {
    const monthIndex = date.getMonth();
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return t(`calendar.months.${monthKeys[monthIndex]}`);
  };

  const formatDate = (date) => {
    return `${getMonthName(date)} ${date.getDate()}`;
  };

  const formatWeekRange = () => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    
    const startYear = currentWeekStart.getFullYear();
    const endYear = weekEnd.getFullYear();
    
    if (startYear === endYear) {
      return `${formatDate(currentWeekStart)} - ${formatDate(weekEnd)}, ${startYear}`;
    } else {
      return `${formatDate(currentWeekStart)}, ${startYear} - ${formatDate(weekEnd)}, ${endYear}`;
    }
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
    return formatAppointmentTime(dateString, i18n.language);
  };

  const getAppointmentStatus = (apt) => {
    if (apt.canceled) return 'canceled';
    if (new Date(apt.appointmentEnd) < new Date()) return 'passed';
    return 'active';
  };

  const handleAppointmentClick = (appointment, event) => {
    event.stopPropagation();
    setSelectedEvent(appointment);
    setShowEventDetails(true);
  };

  const handleCancelClick = (appointment, event) => {
  };

  const handleSlotClick = (day, timeSlot) => {
    if (!isProviderMode || !effectiveDoctorId) return;
    
    const [hours, minutes] = timeSlot.split(':');
    const slotDate = new Date(day);
    slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    setSelectedSlot({
      date: slotDate,
      time: timeSlot
    });
    setShowQuickSchedule(true);
  };

  const handleSlotRightClick = (day, timeSlot, event) => {
    event.preventDefault();
    
    if (!isDoctorProviderMode) return;
    
    const [hours, minutes] = timeSlot.split(':');
    const slotDate = new Date(day);
    slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    setSelectedSlot({
      date: slotDate,
      time: timeSlot
    });
    setShowPersonalEvent(true);
  };

  const handleQuickScheduleSuccess = () => {
    setShowQuickSchedule(false);
    onAppointmentUpdate();
  };

  const handlePersonalEventSuccess = () => {
    setShowPersonalEvent(false);
    onAppointmentUpdate();
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

  const handleDeleteEvent = async (eventId, isRecurring = false) => {
    try {
      let deleteAll = false;

      if (isRecurring) {
        const confirmDelete = window.confirm(t('calendar.confirmDelete.recurringPrompt'));
        if (confirmDelete === null) return;
        deleteAll = confirmDelete;
      } else {
        const confirmDelete = window.confirm(t('calendar.confirmDelete.message'));
        if (!confirmDelete) return;
      }

      await calendarEventService.deletePersonalEvent(userId, eventId, deleteAll);
      
      setCalendarEvents(prev => prev.filter(e => 
        deleteAll ? e.parentEventId !== eventId && e.eventId !== eventId : e.eventId !== eventId
      ));
      
      if (onAppointmentUpdate) {
        onAppointmentUpdate();
      }
      
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);
      const startDate = currentWeekStart.toISOString().split('T')[0];
      const endDate = weekEnd.toISOString().split('T')[0];
      const response = await calendarEventService.getCalendarEvents(userId, startDate, endDate);
      setCalendarEvents(response.events || []);
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      alert(t('calendar.deleteError'));
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
              {isRTL ? <ChevronRight /> : <ChevronLeft />}
            </NavButton>
            <CurrentWeekLabel>{formatWeekRange()}</CurrentWeekLabel>
            <NavButton onClick={goToNextWeek}>
              {isRTL ? <ChevronLeft /> : <ChevronRight />}
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
              <TimeSlot key={time}>{formatTimeSlotLabel(time)}</TimeSlot>
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
                      onClick={() => handleSlotClick(day, time)}
                      onContextMenu={isDoctorProviderMode ? (e) => handleSlotRightClick(day, time, e) : undefined}
                      style={{
                        height: '60px',
                        borderBottom: '1px solid #e2e8f0',
                        borderRight: dayIndex < 6 ? '1px solid #e2e8f0' : 'none',
                        boxSizing: 'border-box',
                        cursor: isProviderMode ? 'pointer' : 'default',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (isProviderMode) {
                          e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title={getSlotTooltip()}
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
                        key={appointment.isPersonalEvent ? appointment.eventId : appointment.appointmentId}
                        style={{
                          ...style,
                          background: appointment.isPersonalEvent 
                            ? `linear-gradient(135deg, ${appointment.color || '#FFB84D'}, ${appointment.color || '#FFB84D'}dd)`
                            : style.background,
                          borderLeft: appointment.isPersonalEvent 
                            ? `4px solid ${appointment.color || '#FFB84D'}`
                            : style.borderLeft,
                          cursor: 'pointer'
                        }}
                        $status={status}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (appointment.isPersonalEvent) {
                            setSelectedEvent(appointment);
                            setShowEventDetails(true);
                          } else {
                            handleAppointmentClick(appointment, e);
                          }
                        }}
                      >
                        <AppointmentContent>
                          {appointment.isPersonalEvent ? (
                            <>
                              <AppointmentTitle style={{ color: 'white', fontWeight: '600' }}>
                                {appointment.title}
                              </AppointmentTitle>
                              <AppointmentTime style={{ color: 'rgba(255,255,255,0.9)' }}>
                                <AccessTime style={{ fontSize: '0.8rem' }} />
                                {formatTime(appointment.appointmentStart)} - {formatTime(appointment.appointmentEnd)}
                              </AppointmentTime>
                              {appointment.description && (
                                <AppointmentInfo style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>
                                  {appointment.description}
                                </AppointmentInfo>
                              )}
                              {appointment.blocksAppointments && (
                                <AppointmentInfo style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                                  <Block style={{ fontSize: '0.8rem' }} /> {t('calendar.blocksAppointments')}
                                </AppointmentInfo>
                              )}
                            </>
                          ) : (
                            <>
                              <AppointmentTitle>
                                {(() => {
                                  const doctorName = getLocalizedDoctorName(appointment, i18n.language);
                                  const patientName = getLocalizedPatientName(appointment, i18n.language);
                                  const doctorPrefix = getDoctorPrefix(i18n.language);

                                  return effectiveUserType === 'patient'
                                    ? `${doctorPrefix} ${doctorName}`
                                    : patientName;
                                })()}
                              </AppointmentTitle>
                              <AppointmentTime>
                                <AccessTime style={{ fontSize: '0.8rem' }} />
                                {formatTime(appointment.appointmentStart)} - {formatTime(appointment.appointmentEnd)}
                              </AppointmentTime>
                              {effectiveUserType === 'patient' && (
                                <AppointmentInfo>
                                  <MedicalServices style={{ fontSize: '0.8rem' }} />
                                  {getLocalizedSpecialtyLabel(appointment.specialty, tMedical) || appointment.specialty}
                                </AppointmentInfo>
                              )}
                              {effectiveUserType === 'doctor' && (
                                <AppointmentInfo>
                                  <Person style={{ fontSize: '0.8rem' }} />
                                  {t('card.patientAge', { age: appointment.age })}
                                </AppointmentInfo>
                              )}
                            </>
                          )}
                          {!isPast && !isCanceled && !appointment.isPersonalEvent && (
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

      {selectedSlot.date && (
        <QuickScheduleModal
          isOpen={showQuickSchedule}
          onClose={() => setShowQuickSchedule(false)}
          selectedDate={selectedSlot.date}
          selectedTime={selectedSlot.time}
          doctorId={effectiveDoctorId}
          creatorType={activeMode}
          patients={patients}
          loading={loadingPatients}
          onSuccess={handleQuickScheduleSuccess}
        />
      )}

      {selectedSlot.date && isDoctorProviderMode && (
        <PersonalEventModal
          isOpen={showPersonalEvent}
          onClose={() => setShowPersonalEvent(false)}
          selectedDate={selectedSlot.date}
          selectedTime={selectedSlot.time}
          doctorId={userId}
          onSuccess={handlePersonalEventSuccess}
        />
      )}

      {showEventDetails && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => {
            setShowEventDetails(false);
            setSelectedEvent(null);
          }}
          onDelete={handleDeleteEvent}
        />
      )}
    </>
  );
};

export default WeeklyCalendarView;

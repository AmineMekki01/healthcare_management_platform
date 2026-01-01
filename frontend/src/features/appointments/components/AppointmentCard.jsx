import React, { useState } from 'react';
import { createEvent } from 'ics';
import { Typography } from '@mui/material';
import { Share, GetApp, Person, Cancel as CancelIcon, AccessTime, CalendarToday, MedicalServices } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CardContainer, CardHeader, TitleText, CardBody, CardFooter, IconButton, CancelButton, CancelButtonContainer, StatusChip, CreateReportButton } from '../styles/appointmentStyles';
import CancelAppointmentModal from './CancelAppointmentModal';
import appointmentService from '../services/appointmentService';

export default function AppointmentCard({ reservation, userType, onAppointmentUpdate }) {
  console.log("reservation : ", reservation)
  const { t } = useTranslation('appointments');
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isPastAppointment = new Date(reservation.appointmentEnd) < new Date();
  const isCanceledAppointment = Boolean(reservation.canceled ?? reservation.Canceled);
  const hasReport = Boolean(reservation.reportExists ?? reservation.ReportExists);

  const createICSFile = () => {
    const start = new Date(reservation.appointmentStart);
    const end = new Date(reservation.appointmentEnd);
    const event = createEvent({
      start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
      end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
      title: t('card.appointmentWith', { doctorName: `${reservation.doctorFirstName} ${reservation.doctorLastName}` }),
      description: t('card.specialty', { specialty: reservation.specialty }),
      location: t('card.onlineConsultation'),
    });

    if (event.error) {
      console.error(event.error);
      return;
    }

    const blob = new Blob([event.value], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'appointment.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareAppointment = () => {
    const shareData = {
      title: t('card.appointmentDetails'),
      text: t('card.shareText', {
        doctorName: `${reservation.doctorFirstName} ${reservation.doctorLastName}`,
        date: formatDate(reservation.appointmentStart),
        time: formatTime(reservation.appointmentStart)
      }),
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      alert(t('card.sharingNotSupported'));
    }
  };

  const handleCancelAppointment = async (reason) => {
    try {
      await appointmentService.cancelAppointment(
        reservation.appointmentId,
        userType,
        reason
      );

      alert(t('card.cancelSuccess'));
      setShowCancelModal(false);
      
      if (onAppointmentUpdate) {
        onAppointmentUpdate();
      }

    } catch (error) {
      console.error('Error canceling appointment:', error);
      alert(t('card.cancelError'));
    }
  };
  const getAppointmentStatus = () => {
    if (isCanceledAppointment) return 'canceled';
    if (isPastAppointment) return 'passed';
    return 'active';
  };

  const getStatusText = () => {
    if (isCanceledAppointment) return t('card.status.canceled');
    if (isPastAppointment) return t('card.status.completed');
    return t('card.status.upcoming');
  };

  return (
    <CardContainer>
      <CardHeader>
        <TitleText variant="h6">
          {userType === 'patient' ? `Dr. ${reservation.doctorFirstName} ${reservation.doctorLastName}` : `${reservation.patientFirstName} ${reservation.patientLastName}`}
        </TitleText>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {userType === 'doctor' && isPastAppointment && !isCanceledAppointment && hasReport && (
            <StatusChip status="report">
              {t('card.reportCreated')}
            </StatusChip>
          )}
          <StatusChip status={getAppointmentStatus()}>
            {getStatusText()}
          </StatusChip>
        </div>
      </CardHeader>
      <CardBody>
        <Typography variant="body1">
          <CalendarToday /> {formatDate(reservation.appointmentStart)}
        </Typography>
        <Typography variant="body1">
          <AccessTime /> {formatTime(reservation.appointmentStart)} - {formatTime(reservation.appointmentEnd)}
        </Typography>
        {userType === 'patient' && (
          <Typography variant="body1">
            <MedicalServices /> {reservation.specialty}
          </Typography>
        )}
        {userType === 'doctor' && (
          <Typography variant="body2">
            <Person /> {t('card.patientAge', { age: reservation.age })}
          </Typography>
        )}
        
      </CardBody>
      <CardFooter>
        <IconButton onClick={() => navigate(userType === 'patient' ? `/doctor-profile/${reservation.doctorId}` : `/patient-profile/${reservation.patientId}`)}>
          {t('card.viewProfile')}
        </IconButton>
        <IconButton onClick={createICSFile}>
          <GetApp />
        </IconButton>
        <IconButton onClick={shareAppointment}>
          <Share />
        </IconButton>
      </CardFooter>

      {!isPastAppointment && !isCanceledAppointment && (
        <CancelButtonContainer>
          <CancelButton onClick={() => setShowCancelModal(true)}>
            <CancelIcon /> {t('card.cancel')}
          </CancelButton>
          <CancelAppointmentModal
            open={showCancelModal}
            handleClose={() => setShowCancelModal(false)}
            handleCancel={handleCancelAppointment}
          />
        </CancelButtonContainer>
      )}
      
      {userType === 'doctor' && !hasReport && isPastAppointment && !isCanceledAppointment && (
        <CreateReportButton onClick={() => navigate(`/create-medical-report/${reservation.appointmentId}`)}>
          {t('card.createReport')}
        </CreateReportButton>
      )}

    </CardContainer>
  );
}

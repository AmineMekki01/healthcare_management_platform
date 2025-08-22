import React, { useState } from 'react';
import { createEvent } from 'ics';
import { Typography } from '@mui/material';
import { Share, GetApp, Person, Cancel as CancelIcon, AccessTime, CalendarToday, MedicalServices } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CardContainer, CardHeader, TitleText, CardBody, CardFooter, IconButton, CancelButton, CancelButtonContainer, StatusChip, CreateReportButton } from '../styles/appointmentStyles';
import CancelAppointmentModal from './CancelAppointmentModal';
import appointmentService from '../services/appointmentService';

export default function AppointmentCard({ reservation, userType, onAppointmentUpdate }) {
  console.log("reservation : ", reservation)
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
  const isCanceledAppointment = reservation.Canceled;

  const createICSFile = () => {
    const start = new Date(reservation.appointmentStart);
    const end = new Date(reservation.appointmentEnd);
    const event = createEvent({
      start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
      end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
      title: `Appointment with ${reservation.doctorFirstName} ${reservation.doctorLastName}`,
      description: `Specialty: ${reservation.specialty}`,
      location: 'Online Consultation',
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
      title: 'Appointment Details',
      text: `Appointment with ${reservation.doctorFirstName} ${reservation.doctorLastName} on ${formatDate(reservation.appointmentStart)} at ${formatTime(reservation.appointmentStart)}`,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      alert('Sharing is not supported on this browser');
    }
  };

  const handleCancelAppointment = async (reason) => {
    try {
      await appointmentService.cancelAppointment(
        reservation.appointmentId,
        userType,
        reason
      );

      alert('Appointment canceled successfully.');
      setShowCancelModal(false);
      
      if (onAppointmentUpdate) {
        onAppointmentUpdate();
      }

    } catch (error) {
      console.error('Error canceling appointment:', error);
      alert('An error occurred while canceling the appointment.');
    }
  };
  const getAppointmentStatus = () => {
    if (isCanceledAppointment) return 'canceled';
    if (isPastAppointment) return 'passed';
    return 'active';
  };

  const getStatusText = () => {
    if (isCanceledAppointment) return 'Canceled';
    if (isPastAppointment) return 'Completed';
    return 'Upcoming';
  };

  return (
    <CardContainer>
      <CardHeader>
        <TitleText variant="h6">
          {userType === 'patient' ? `Dr. ${reservation.doctorFirstName} ${reservation.doctorLastName}` : `${reservation.patientFirstName} ${reservation.patientLastName}`}
        </TitleText>
        <StatusChip status={getAppointmentStatus()}>
          {getStatusText()}
        </StatusChip>
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
            <Person /> Patient Age: {reservation.age}
          </Typography>
        )}
        
      </CardBody>
      <CardFooter>
        <IconButton onClick={() => navigate(userType === 'patient' ? `/doctor-profile/${reservation.doctorId}` : `/patient-profile/${reservation.patientId}`)}>
          View Profile
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
            <CancelIcon /> Cancel
          </CancelButton>
          <CancelAppointmentModal
            open={showCancelModal}
            handleClose={() => setShowCancelModal(false)}
            handleCancel={handleCancelAppointment}
          />
        </CancelButtonContainer>
      )}
      
      {userType === 'doctor' && !reservation.reportExists && !reservation.isDoctorPatient && isPastAppointment && (
        <CreateReportButton onClick={() => navigate(`/create-medical-report/${reservation.appointmentId}`)}>
          Create Report
        </CreateReportButton>
      )}

    </CardContainer>
  );
}

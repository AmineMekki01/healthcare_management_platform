import React, {useContext, useState} from 'react';
import { createEvent } from 'ics';
import { Card, CardContent, CardActions, Typography, Button, Chip } from '@mui/material';
import { EventNote, Share, GetApp, Person, Cancel as CancelIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CardContainer, CardHeader, TitleText, CardBody, CardFooter, IconButton, CancelButton, CancelButtonContainer} from './styles/AppointmentCardStyles';
import CancelAppointmentModal from './CancelAppointmentModal';
import axios from './../axiosConfig';

export default function AppointmentCard({ reservation, userType }) {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  console.log("userType : ", userType)
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isPastAppointment = new Date(reservation.reservation_end) < new Date();
  const isCanceledAppointment = reservation.Canceled;

  const createICSFile = () => {
    const start = new Date(reservation.reservation_start);
    const end = new Date(reservation.reservation_end);
    const event = createEvent({
      start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
      end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
      title: `Appointment with ${reservation.doctor_first_name} ${reservation.doctor_last_name}`,
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
      text: `Appointment with ${reservation.doctor_first_name} ${reservation.doctor_last_name} on ${formatDate(reservation.reservation_start)} at ${formatTime(reservation.reservation_start)}`,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      alert('Sharing is not supported on this browser');
    }
  };

  const handleCancelAppointment = async (reason) => {
    try {
      await axios.post('/api/v1/cancel-appointment', {
        appointment_id: reservation.reservation_id,
        canceled_by: userType,
        cancellation_reason: reason,
      });
      alert('Appointment canceled successfully.');
      setShowCancelModal(false);

    } catch (error) {
      console.error('Error canceling appointment:', error);
      alert('An error occurred while canceling the appointment.');
    }
  };
  return (
    <CardContainer>
      <CardHeader>
        <TitleText variant="h6">
          {userType === 'patient' ? `Dr. ${reservation.doctor_first_name} ${reservation.doctor_last_name}` : `${reservation.patient_first_name} ${reservation.patient_last_name}`}
        </TitleText>
        {
          userType === 'patient' ? <Chip label={reservation.specialty} color="primary" /> : <></>
        }
      </CardHeader>
      <CardBody>
        <Typography variant="body1">
          <EventNote /> {formatDate(reservation.reservation_start)}
        </Typography>
        <Typography variant="body1">
          {formatTime(reservation.reservation_start)} - {formatTime(reservation.reservation_end)}
        </Typography>
        {userType === 'doctor' && (
          <Typography variant="body2">
            <Person /> Patient Age: {reservation.age}
          </Typography>
        )}
      </CardBody>
      <CardFooter>
        {userType === 'patient' ? (
          <IconButton onClick={() => navigate(`/DoctorProfile/${reservation.doctor_id}`)}>
            View Profile
          </IconButton>
        ) : (
          <IconButton onClick={() => navigate(`/PatientProfile/${reservation.patient_id}`)}>
            View Profile
          </IconButton>
        )}
        <IconButton onClick={createICSFile}>
          <GetApp />
        </IconButton>
        <IconButton onClick={shareAppointment}>
          <Share />
        </IconButton>
      </CardFooter>

      {!isPastAppointment && !isCanceledAppointment && (
        <CancelButtonContainer style={{ marginTop: '15px' }}>
          <CancelButton onClick={() => setShowCancelModal(true)}>
          <CancelIcon /> Cancel Appointment
          </CancelButton>
          <CancelAppointmentModal
            open={showCancelModal}
            handleClose={() => setShowCancelModal(false)}
            handleCancel={handleCancelAppointment}
          />
        </CancelButtonContainer>
      )}
      
      {userType === 'doctor' && (
          <Button onClick={() => navigate(`/DoctorReport/${reservation.reservation_id}`)}>
            Create Report
          </Button>
        )}

    </CardContainer>
  );
}

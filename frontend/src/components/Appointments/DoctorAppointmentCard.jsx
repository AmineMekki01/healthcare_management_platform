// DoctorAppointmentCard.jsx
import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

export default function DoctorAppointmentCard({ reservation }) {
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="div">
          Patient: {reservation.patient_first_name} {reservation.patient_last_name}
        </Typography>
        <Typography color="text.secondary">
          Age: {reservation.age}
        </Typography>
        <Typography variant="body2">
          Start: {formatDate(reservation.reservation_start)}
        </Typography>
        <Typography variant="body2">
          End: {formatDate(reservation.reservation_end)}
        </Typography>
      </CardContent>
    </Card>
  );
}
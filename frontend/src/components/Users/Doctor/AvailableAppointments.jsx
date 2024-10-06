import React, { useState, useEffect, useContext} from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
    AppointmentContainer, 
    Title, 
    Button, 
    Text, 
    DatePickerContainer, 
    TimeSlotsGrid, 
    TimeSlot,
    FormContainer 
} from './styles/AvailableAppointmentsStyles';
import { AuthContext } from './../../Auth/AuthContext';  

export default function AvailableAppointments({ doctorId , doctorFullName}) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { userId } = useContext(AuthContext);

  useEffect(() => {
    fetchAppointments(selectedDate);
  }, [doctorId, selectedDate]);

  const fetchAppointments = (date) => {
    setLoading(true);
    const day = date.toISOString().split('T')[0];
    const currentTime = new Date().toISOString();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    axios.get(`http://localhost:3001/api/v1/availabilities`, {
      params: {
        doctorId,
        day,
        currentTime,
        timeZone
      }
    })
    .then(response => {
      setAppointments(response.data);
      setLoading(false);
    })
    .catch(error => {
      console.error(error);
      setLoading(false);
      setError('An error occurred while fetching the available appointments.');
    });
  };

  const bookAppointment = () => {
    if (!selectedSlot) {
      alert('Please select a time slot before booking.');
      return;
    }
    axios.post('http://localhost:3001/api/v1/reservations', {
      AppointmentStart: selectedSlot.AvailabilityStart,
      AppointmentEnd: selectedSlot.AvailabilityEnd,
      AppointmentTitle: `Appointment with Dr. ${doctorFullName}`,
      DoctorID: doctorId,
      PatientID: userId,
      AvailabilityID: selectedSlot.AvailabilityId
    })
    .then(response => {
      alert('Appointment booked successfully');
      setSelectedSlot(null);
      fetchAppointments(selectedDate);
    })
    .catch(error => {
      console.error(error);
      setError('An error occurred while booking the appointment.');
    });
  };

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
  };

  return (
    <AppointmentContainer>
      <Title>Make an Appointment</Title>
      <FormContainer>
        <DatePickerContainer>
          <DatePicker 
            selected={selectedDate}
            onChange={date => setSelectedDate(date)}
            inline
            calendarClassName="big-calendar"
          />
        </DatePickerContainer>
        <TimeSlotsGrid>
          {loading ? <div>Loading...</div> : (
            <>
              {appointments && appointments.length > 0 ? (
                appointments.map((slot) => (
                  <TimeSlot 
                    key={slot.AvailabilityId}
                    onClick={() => handleSlotClick(slot)}
                    isSelected={selectedSlot && selectedSlot.AvailabilityId === slot.AvailabilityId}
                  >
                    <Text
                    
                    isSelected={selectedSlot && selectedSlot.AvailabilityId === slot.AvailabilityId}
                    >{new Date(slot.AvailabilityStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </TimeSlot>
                ))
              ) : (
                <Text>No Available Appointments.</Text>
              )}
            </>
          )}
          {error && <Text>{error}</Text>}
        </TimeSlotsGrid>
      </FormContainer>
      <Button onClick={bookAppointment}>Book</Button>
    </AppointmentContainer>
  );
}

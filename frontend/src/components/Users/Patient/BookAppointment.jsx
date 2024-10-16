import React, { useState, useEffect, useContext, useReducer } from 'react';
import axios from './../../axiosConfig';
import { useParams } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment-timezone';
import { TimeSlot, BookAppointmentBlock, TimeSlotContainer, BookingButton} from './styles/BookAppointmentStyles';
import { AuthContext } from './../../Auth/AuthContext';  


function BookAppointment({show}) {
  const [availability, setAvailability] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState();
  const { doctorId: urlDoctorId } = useParams();  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());   
  const [timeZone, setTimeZone] = useState('');
  const currentDate = new Date();
  const maxDate = new Date();
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  maxDate.setDate(currentDate.getDate() + 6);
  const { 
    userId, userType
  } = useContext(AuthContext);

  useEffect(() => {
    setTimeZone(moment.tz.guess()); 
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {  
      setCurrentTime(new Date());
    }, 60000);  

    return () => clearInterval(intervalId);  
  }, []);

  useEffect(() => {
    const dateString = selectedDate.toISOString().split('T')[0];
    const currentTime = new Date().toISOString();
    axios.get(`http://localhost:3001/api/v1/availabilities?doctorId=${urlDoctorId}&day=${dateString}&currentTime=${currentTime}&timeZone=${timeZone}`)
      .then(response => {
        console.log("Received availability: ", response.data); 
      setAvailability(response.data);
      })
      .catch(error => {
        console.error(error);
      });
  }, [urlDoctorId, selectedDate, timeZone]);

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
  };

  const fetchAvailabilities = () => {
    const dateString = selectedDate.toISOString().split('T')[0];
    const currentTime = new Date().toISOString();
    axios.get(`http://localhost:3001/api/v1/availabilities?doctorId=${urlDoctorId}&day=${dateString}&currentTime=${currentTime}&timeZone=${timeZone}`)
      .then(response => {
        console.log("Received availability: ", response.data); 
        setAvailability(response.data);
      })
      .catch(error => {
        console.error(error);
      });
  };
  
  useEffect(() => {
    fetchAvailabilities();
  }, [urlDoctorId, selectedDate, timeZone]);
  

  const handleBookAppointment = () => {
    const reservationDetails = {
      AppointmentStart: selectedSlot.AvailabilityStart,
      AppointmentEnd: selectedSlot.AvailabilityEnd,
      AppointmentTitle: 'New Appointment',
      DoctorID: urlDoctorId,
      PatientID: userId,
      AvailabilityID: selectedSlot.AvailabilityId,
    };    
  
    axios.post('http://localhost:3001/api/v1/reservations', reservationDetails)
    .then(response => {
      alert('Appointment booked successfully!');
      fetchAvailabilities();
      setSelectedSlot(null);
    })
    .catch(error => {
      console.error(error);
      alert('Failed to book appointment. Please try again.');
    });
  };

  return (
    <BookAppointmentBlock>
      <DatePicker
        selected={selectedDate}
        onChange={date => setSelectedDate(date)}
        dateFormat="yyyy-MM-dd"
        minDate={currentDate}
        maxDate={maxDate}
        className='mb-2'
      />
      <TimeSlotContainer>
      {availability && availability.map(slot=> {
          const localStart = moment(slot.AvailabilityStart).format('YYYY-MM-DD HH:mm:ss');
          const localEnd = moment(slot.AvailabilityEnd).format('YYYY-MM-DD HH:mm:ss');
     
          return (
            <TimeSlot
              key={slot.AvailabilityId}
              onClick={() => handleSlotClick(slot)}
              isSelected={selectedSlot && selectedSlot.AvailabilityId === slot.AvailabilityId}
              >
              {localStart.split(' ')[1]} - {localEnd.split(' ')[1]}
            </TimeSlot>
          );
        })}
      </TimeSlotContainer>
      
      {show && selectedSlot && (
        <BookingButton onClick={handleBookAppointment}>Book Appointment</BookingButton>
      )}

    </BookAppointmentBlock>
  );
}

export default BookAppointment;


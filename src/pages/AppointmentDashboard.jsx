import React, { useState, useEffect, useContext  } from 'react';
import axios from 'axios';
import { Title, Container, Flex } from './../components/Appointments/styles/AppointmentDashboard.styles';
import CardCom from '../components/Appointments/AppointmentCard';
import { AuthContext } from './../components/Auth/AuthContext';  


export default function Dashboard() {
  const [reservations, setReservations] = useState([]);
  const { doctorId, patientId, userType } = useContext(AuthContext);

  useEffect(() => {
 
    const queryParam = userType === 'doctor' ? `doctor_id=${doctorId}` : `patient_id=${patientId}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    axios.get(`http://localhost:3001/api/v1/reservations?${queryParam}&timezone=${timezone}`)

        .then(response => {
            setReservations(response.data);
        })
        .catch(error => {
            console.error(error);
        });
}, [doctorId, patientId, userType]);

  return (
      <Container>
          <Title>My Upcoming Appointments</Title>
          <Flex>
          {reservations && reservations.map(reservation => (
                  <CardCom
                    key={reservation.reservation_id}
                    duration={30} 
                    appointment_start={reservation.reservation_start}
                    appointment_finish={reservation.reservation_end}
                    doctor_name={reservation.doctor_first_name+" "+reservation.doctor_last_name} 
                    doctor_specialty={reservation.specialty} 
                    userName={reservation.patient_first_name+" "+reservation.patient_last_name}
                    userAge={reservation.age}
                    userType={userType}
                    doctorId={reservation.doctor_id}
                  />
                  
              ))}
          </Flex>
      </Container>
  );
}
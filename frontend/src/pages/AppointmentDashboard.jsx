import React, { useState, useEffect, useContext  } from 'react';
import axios from './../components/axiosConfig';
import { Title, Container, Flex } from './../components/Appointments/styles/AppointmentDashboard.styles';
import CardCom from '../components/Appointments/AppointmentCard';
import { AuthContext } from './../components/Auth/AuthContext';  


export default function Dashboard() {
  const [reservations, setReservations] = useState([]);
  const {userType, userId} = useContext(AuthContext);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const params = {
          timezone,
        };
        if (userType === 'doctor') {
          params.doctor_id = userId;
        } else {
          params.patient_id = userId;
        }

        const response = await axios.get('/api/v1/reservations', { params });
        setReservations(response.data);
      } catch (error) {
        console.error('Error fetching reservations:', error);
      }
    };

    fetchReservations();
  }, [userId, userType]);

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
import React, { useState, useEffect, useContext } from 'react';
import axios from './../components/axiosConfig';
import { Title, Container, Flex, FilterContainer, FilterInput, SectionTitle} from './styles/AppointmentDashboard.styles';
import AppointmentCard from '../components/Appointments/AppointmentCard';
import { AuthContext } from './../components/Auth/AuthContext';


export default function Dashboard() {
  const [doctorReservations, setDoctorReservations] = useState([]);
  const [patientReservations, setPatientReservations] = useState([]);
  const [filterText, setFilterText] = useState('');
  const { userType, userId } = useContext(AuthContext);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        if (!userId) {
          return;
        }
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const params = {
          timezone,
          user_id: userId,
          user_type: userType,
        };
        console.log("Params: ", params);

        const response = await axios.get('/api/v1/reservations', { params });
        console.log("Reservations: ", response.data);
        
        if (userType === 'doctor') {
          const doctorAppts = response.data.filter(r => !r.is_doctor_patient);
          const patientAppts = response.data.filter(r => r.is_doctor_patient);
          setDoctorReservations(doctorAppts);
          setPatientReservations(patientAppts);
        } else {
          setPatientReservations(response.data);
        }
      } catch (error) {
        console.error('Error fetching reservations:', error);
      }
    };

    fetchReservations();
  }, [userId, userType]);

  const filterReservations = (reservations) => {
    return reservations.filter(reservation => 
      reservation.doctor_first_name.toLowerCase().includes(filterText.toLowerCase()) ||
      reservation.doctor_last_name.toLowerCase().includes(filterText.toLowerCase()) ||
      reservation.patient_first_name.toLowerCase().includes(filterText.toLowerCase()) ||
      reservation.patient_last_name.toLowerCase().includes(filterText.toLowerCase())
    );
  };

  return (
    <Container>
      <Title>My Upcoming Appointments</Title>
      <FilterContainer>
        <FilterInput
          type="text"
          placeholder="Filter by name"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </FilterContainer>
      
      {userType === 'doctor' && (
        <>
          <SectionTitle>My Appointments as Doctor</SectionTitle>
          <Flex>
            {doctorReservations && filterReservations(doctorReservations).map(reservation => (
              <AppointmentCard
                key={reservation.reservation_id}
                reservation={reservation}
                userType={"doctor"}
              />
            ))}
          </Flex>
          
          <SectionTitle>My Appointments as Patient</SectionTitle>
        </>
      )}
      
      <Flex>
        {patientReservations && filterReservations(patientReservations).map(reservation => (
          <AppointmentCard
            key={reservation.reservation_id}
            reservation={reservation}
            userType={"patient"}
          />
        ))}
      </Flex>
    </Container>
  );
}
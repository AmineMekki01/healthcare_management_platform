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

        const response = await axios.get('/api/v1/reservations', { params });
        const now = new Date();

        if (userType === 'doctor') {
          const activeDoctorAppts = response.data.filter(r => !r.is_doctor_patient && !r.Canceled && new Date(r.reservation_end) > now);
          const passedDoctorAppts = response.data.filter(r => !r.is_doctor_patient && !r.Canceled && new Date(r.reservation_end) <= now);
          const canceledDoctorAppts = response.data.filter(r => !r.is_doctor_patient && r.Canceled);

          const activePatientAppts = response.data.filter(r => r.is_doctor_patient && !r.Canceled && new Date(r.reservation_end) > now);
          const passedPatientAppts = response.data.filter(r => r.is_doctor_patient && !r.Canceled && new Date(r.reservation_end) <= now);
          const canceledPatientAppts = response.data.filter(r => r.is_doctor_patient && r.Canceled);

          setDoctorReservations({ active: activeDoctorAppts, passed: passedDoctorAppts, canceled: canceledDoctorAppts });
          setPatientReservations({ active: activePatientAppts, passed: passedPatientAppts, canceled: canceledPatientAppts });
        } else {
          const activePatientAppts = response.data.filter(r => !r.Canceled && new Date(r.reservation_end) > now);
          const passedPatientAppts = response.data.filter(r => !r.Canceled && new Date(r.reservation_end) <= now);
          const canceledPatientAppts = response.data.filter(r => r.Canceled);

          setPatientReservations({ active: activePatientAppts, passed: passedPatientAppts, canceled: canceledPatientAppts });
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
      <Title>My Appointments Review : </Title>
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
          <SectionTitle>My Active Appointments as Doctor</SectionTitle>
          <Flex>
            {doctorReservations.active && filterReservations(doctorReservations.active).map(reservation => (
              <AppointmentCard
                key={reservation.reservation_id}
                reservation={reservation}
                userType={"doctor"}
              />
            ))}
          </Flex>

          <SectionTitle>My Passed Appointments as Doctor</SectionTitle>
          <Flex>
            {doctorReservations.passed && filterReservations(doctorReservations.passed).map(reservation => (
              <AppointmentCard
                key={reservation.reservation_id}
                reservation={reservation}
                userType={"doctor"}
              />
            ))}
          </Flex>

          <SectionTitle>My Canceled Appointments as Doctor</SectionTitle>
          <Flex>
            {doctorReservations.canceled && filterReservations(doctorReservations.canceled).map(reservation => (
              <AppointmentCard
                key={reservation.reservation_id}
                reservation={reservation}
                userType={"doctor"}
              />
            ))}
          </Flex>

          <SectionTitle>My Active Appointments as Patient</SectionTitle>
          <Flex>
            {patientReservations.active && filterReservations(patientReservations.active).map(reservation => (
              <AppointmentCard
                key={reservation.reservation_id}
                reservation={reservation}
                userType={"doctor"}
              />
            ))}
          </Flex>

          <SectionTitle>My Passed Appointments as Patient</SectionTitle>
          <Flex>
            {patientReservations.passed && filterReservations(patientReservations.passed).map(reservation => (
              <AppointmentCard
                key={reservation.reservation_id}
                reservation={reservation}
                userType={"doctor"}
              />
            ))}
          </Flex>

          <SectionTitle>My Canceled Appointments as Patient</SectionTitle>
          <Flex>
            {patientReservations.canceled && filterReservations(patientReservations.canceled).map(reservation => (
              <AppointmentCard
                key={reservation.reservation_id}
                reservation={reservation}
                userType={"doctor"}
              />
            ))}
          </Flex>
        </>
      )}

      {userType === 'patient' && (
        <>
          <SectionTitle>My Active Appointments</SectionTitle>
          <Flex>
            {patientReservations.active && filterReservations(patientReservations.active).map(reservation => (
              <AppointmentCard
                key={reservation.reservation_id}
                reservation={reservation}
                userType={"patient"}
              />
            ))}
          </Flex>

          <SectionTitle>My Passed Appointments</SectionTitle>
          <Flex>
            {patientReservations.passed && filterReservations(patientReservations.passed).map(reservation => (
              <AppointmentCard
                key={reservation.reservation_id}
                reservation={reservation}
                userType={"patient"}
              />
            ))}
          </Flex>

          <SectionTitle>My Canceled Appointments</SectionTitle>
          <Flex>
            {patientReservations.canceled && filterReservations(patientReservations.canceled).map(reservation => (
              <AppointmentCard
                key={reservation.reservation_id}
                reservation={reservation}
                userType={"patient"}
              />
            ))}
          </Flex>
        </>
      )}
    </Container>
  );
}
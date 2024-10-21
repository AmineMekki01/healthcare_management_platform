import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import axios from '../axiosConfig';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const CounterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: fit-content;
  margin: 20px auto;
`;

const NumberDisplay = styled.div`
  font-size: 64px;
  font-weight: bold;
  color: #333;
  margin-left: 15px;
`;

const Label = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #555;
  margin-left: 15px;
`;

const Icon = styled.div`
  font-size: 48px;
  color: ${props => props.color || '#333'};
`;

export default function AppointmentsChart({
  userId,
  userType,
  appointmentType,
  label,
  icon,
  color,
  pieTitle,
  apiType,
}) {
  const [countAsPatient, setCountAsPatient] = useState(0);
  const [countAsDoctor, setCountAsDoctor] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCount = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/v1/appointments/stats', {
          params: {
            user_id: userId,
            user_type: userType,
            appointment_type: apiType,
          },
        });
        setCountAsPatient(response.data.as_patient);
        setCountAsDoctor(response.data.as_doctor);
        setLoading(false);
      } catch (error) {
        console.error(`Error fetching ${appointmentType} appointments count:`, error);
        setError('Error fetching data');
        setLoading(false);
      }
    };
    if (userId && userType) {
      fetchCount();
    }
  }, [userId, userType, apiType]);

  const getColorPalette = (appointmentType) => {
    if (appointmentType === 'attended') {
      return {
        backgroundColor: ['rgba(145, 215, 215, 0.8)', 'rgba(95, 175, 175, 0.8)'],
        hoverBackgroundColor: ['rgba(145, 215, 215, 1)', 'rgba(95, 175, 175, 1)'],
      };
    } else if (appointmentType === 'canceled') {
      return {
        backgroundColor: ['rgba(224, 136, 154, 0.8)', 'rgba(253, 159, 179, 0.8)'],
        hoverBackgroundColor: ['rgba(224, 136, 154, 1)', 'rgba(253, 159, 179, 1)'],
      };
    }
    return {
      backgroundColor: ['rgba(200, 200, 200, 0.8)', 'rgba(180, 180, 180, 0.8)'],
      hoverBackgroundColor: ['rgba(200, 200, 200, 1)', 'rgba(180, 180, 180, 1)'],
    };
  };

  const colors = getColorPalette(appointmentType);

  const dataDoctor = {
    labels: ['As Doctor', 'As Patient'],
    datasets: [
      {
        label: `${appointmentType} Appointments`,
        data: [countAsDoctor, countAsPatient],
        backgroundColor: colors.backgroundColor,
        hoverBackgroundColor: colors.hoverBackgroundColor,
      },
    ],
  };

  const options = {
    plugins: {
      title: {
        display: true,
        text: pieTitle,
        font: {
          size: 18,
        },
        padding: {
          top: 10,
          bottom: 30,
        },
      },
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : userType === 'patient' ? (
        <CounterContainer>
          <Icon color={color}>
            <FontAwesomeIcon icon={icon} />
          </Icon>
          <NumberDisplay>{countAsPatient}</NumberDisplay>
          <Label>{label}</Label>
        </CounterContainer>
      ) : (
        <Pie data={dataDoctor} options={options} />
      )}
      {error && <p>{error}</p>}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import axios from './../axiosConfig';

export default function AttendedAppointmentsChart({ userId, userType }) {
  const [attendedCount, setAttendedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttendedCount = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/v1/appointments/stats', {
          params: {
            user_id: userId,
            user_type: userType,
            appointment_type: 'attended',
          }
        });
        setAttendedCount(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching attended appointments count:', error);
        setError('Error fetching data');
        setLoading(false);
      }
    };
    if(userId && userType) {
        fetchAttendedCount();
    }
  }, [userId]);

  const data = {
    labels: ['Attended Appointments'],
    datasets: [
      {
        label: '# of Attended Appointments',
        data: [attendedCount],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      {loading ? <p>Loading...</p> : <Bar data={data} />}
      {error && <p>{error}</p>}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import axios from './../axiosConfig';

export default function CanceledAppointmentsChart({ userId, userType }) {
  const [canceledCount, setCanceledCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    
    const fetchCanceledCount = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/v1/appointments/stats', {
          params: {
            user_id: userId,
            user_type: userType,
            appointment_type: 'canceled',
          }
        });
        setCanceledCount(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching canceled appointments count:', error);
        setError('Error fetching data');
        setLoading(false);
      }
    };
    if(userId && userType) {
        fetchCanceledCount();
    }
  }, [userId]);

  const data = {
    labels: ['Canceled Appointments'],
    datasets: [
      {
        label: '# of Canceled Appointments',
        data: [canceledCount],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
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

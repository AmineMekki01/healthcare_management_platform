import React from 'react';
import PropTypes from 'prop-types';
import { Pie } from 'react-chartjs-2';
import { Typography, Box, Alert } from '@mui/material';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const AgePieChart = ({ data, title, textColor = '#333' }) => {
    if (!data || !data.labels || !data.values || data.labels.length === 0 || data.values.length === 0) {
        return (
            <Box sx={{ 
                width: '100%', 
                maxWidth: 350, 
                mx: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
                    {title}
                </Typography>
                <Alert severity="info" sx={{ width: '100%' }}>
                    No data available for this chart
                </Alert>
            </Box>
        );
    }

    const SimpleFallback = () => (
        <Box sx={{ 
            width: '100%', 
            maxWidth: 350, 
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
                {title}
            </Typography>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1, 
                width: '100%',
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                bgcolor: 'grey.50'
            }}>
                {data.labels.map((label, index) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ 
                                width: 16, 
                                height: 16, 
                                bgcolor: ['#667eea', '#764ba2', '#99B898', '#F18277', '#EB485E'][index] || '#ccc',
                                borderRadius: '50%'
                            }} />
                            <Typography variant="body2">{label}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="bold">{data.values[index]}%</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );

    try {
        const chartData = {
            labels: data.labels,
            datasets: [
                {
                    data: data.values,
                    backgroundColor: [
                        '#667eea',
                        '#764ba2', 
                        '#99B898',
                        '#F18277',
                        '#EB485E',
                    ],
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#fff',
                },
            ],
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                title: {
                    display: false,
                },
                legend: {
                    position: 'bottom',
                    align: 'center',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 12,
                            family: 'Roboto, sans-serif',
                        },
                        color: textColor,
                    },
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#fff',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            },
            elements: {
                arc: {
                    borderWidth: 3,
                    borderColor: '#fff',
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1000,
            }
        };

        return (
            <Box sx={{ 
                width: '100%', 
                maxWidth: 400, 
                mx: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center', color: textColor }}>
                    {title}
                </Typography>
                <Box sx={{ 
                    width: '100%', 
                    height: 300,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Pie data={chartData} options={chartOptions} />
                </Box>
            </Box>
        );
    } catch (error) {
        console.error('Chart rendering error:', error);
        return <SimpleFallback />;
    }
};

AgePieChart.propTypes = {
    data: PropTypes.shape({
        labels: PropTypes.arrayOf(PropTypes.string),
        values: PropTypes.arrayOf(PropTypes.number),
    }),
    title: PropTypes.string,
    textColor: PropTypes.string,
};

AgePieChart.defaultProps = {
    data: { labels: [], values: [] },
    title: 'Age Distribution',
    textColor: '#333',
};

export default React.memo(AgePieChart);

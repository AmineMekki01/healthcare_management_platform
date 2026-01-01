import React from 'react';
import PropTypes from 'prop-types';
import { Pie } from 'react-chartjs-2';
import { Typography, Box, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const AgePieChart = ({ data, title, textColor = '#333' }) => {
    const { t } = useTranslation('common');
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
                    {t('charts.noDataAvailable')}
                </Alert>
            </Box>
        );
    }

    const palette = ['#667eea', '#764ba2', '#99B898', '#F18277', '#EB485E', '#4ECDC4', '#F9C74F'];
    const total = data.values.reduce((a, b) => a + b, 0);

    const legendItems = data.labels.map((label, index) => ({
        label,
        value: data.values[index],
        color: palette[index % palette.length],
    }));

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
                                bgcolor: palette[index % palette.length] || '#ccc',
                                borderRadius: '50%'
                            }} />
                            <Typography variant="body2">{label}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="bold">
                            {data.values[index]}{total > 0 ? ` (${((data.values[index] / total) * 100).toFixed(1)}%)` : ''}
                        </Typography>
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
                    backgroundColor: data.labels.map((_, index) => palette[index % palette.length]),
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
                    display: false,
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
                    height: 260,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Pie data={chartData} options={chartOptions} />
                </Box>

                <Box sx={{ width: '100%', mt: 2, px: 1, maxHeight: 140, overflowY: 'auto' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5 }}>
                        {legendItems.map((item, index) => (
                            <Box
                                key={`${item.label}-${index}`}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    flex: '1 1 45%',
                                    minWidth: 140,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 10,
                                        height: 10,
                                        bgcolor: item.color,
                                        borderRadius: '50%',
                                        flex: '0 0 auto',
                                        border: '1px solid rgba(255,255,255,0.7)'
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: textColor,
                                        whiteSpace: 'normal',
                                        wordBreak: 'break-word',
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {item.label}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{ color: textColor, opacity: 0.9, ml: 'auto' }}
                                >
                                    {item.value}{total > 0 ? ` (${((item.value / total) * 100).toFixed(1)}%)` : ''}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
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

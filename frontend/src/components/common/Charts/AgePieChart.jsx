import React from 'react';
import { Pie } from 'react-chartjs-2';
import 'chart.js';
import styled from 'styled-components';

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);


const PieWrapper = styled.div`
    
    width: 300px;
    
`;

const AgePieChart = ({ data, title }) => {
    const chartData = {
        labels: data.labels,
        datasets: [
            {
                data: data.values,
                backgroundColor: [
                    '#99B898',
                    '#BE9886',
                    '#F18277',
                    '#EB485E',
                    '#28353B',
                ],
            },
        ],
    };

    const chartOptions = {
        plugins: {
            title: {
                display: true,
                text: title,
                align: 'center',
               
            },
            legend: {
                position: 'top',
                align: 'center',
            },
        }
    };

    return (
        <div>
            <PieWrapper>
                <Pie data={chartData} options={chartOptions} />
            </PieWrapper>
        </div>
    );
};

export default AgePieChart;

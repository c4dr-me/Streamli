import React from 'react';
import { Line } from 'react-chartjs-2';

const MessagesPerHourChart = ({ data }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Messages per Hour</h2>
      <Line 
        data={data} 
        options={{
          responsive: true,
          animation: {
            duration: 1500,
            easing: 'easeInOutQuad',
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
            },
            y: {
              grid: {
                display: true,
              },
              beginAtZero: true,
            },
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: 'white',
              },
            },
            title: {
              display: true,
              text: 'Messages per Hour',
              color: 'white',
              font: {
                size: 18,
              },
            },
          },
        }} 
      />
    </div>
  );
};

export default MessagesPerHourChart;
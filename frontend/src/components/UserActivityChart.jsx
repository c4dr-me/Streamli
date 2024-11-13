import React from 'react';
import { Bar } from 'react-chartjs-2';

const UserActivityChart = ({ data }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">User Join/Leave Activity per Hour</h2>
      <Bar 
        data={data} 
        options={{
          responsive: true,
          animation: {
            duration: 1500,
            easing: 'easeInOutQuad',
          },
          scales: {
            x: {
              stacked: true,
              grid: {
                display: false,
              },
            },
            y: {
              stacked: true,
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
              text: 'User Join/Leave Activity per Hour',
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

export default UserActivityChart;
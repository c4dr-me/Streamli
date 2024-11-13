import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

const UserMessagesOverTimeChart = ({ data }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Messages Sent by User Over Time</h2>
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
              type: 'time',
              time: {
                unit: 'hour',
                tooltipFormat: 'PPpp',
                displayFormats: {
                  hour: 'MMM d, h:mm a',
                },
              },
              grid: {
                display: true,
              },
              title: {
                display: true,
                text: 'Time (IST)',
                color: 'white',
                  },
                  ticks: {
                  source: 'data',
              },
            },
            y: {
              grid: {
                display: true,
              },
              beginAtZero: true,
              title: {
                display: true,
                text: 'Messages',
                color: 'white',
              },
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
              text: 'Messages Sent by User Over Time',
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

export default UserMessagesOverTimeChart;
import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { enIN } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, TimeScale);

const Analytics = ({ chatMessages = [], usersInRoom = [], userActivity = [] }) => {
  const [messageData, setMessageData] = useState(null);
  const [userActivityData, setUserActivityData] = useState(null);
  const [userMessageData, setUserMessageData] = useState(null);

  // Debugging logs for raw userActivity
  useEffect(() => {
    console.log('Raw userActivity data:', userActivity);
  }, [userActivity]);

  // Log userActivityData after it's updated
  useEffect(() => {
    if (userActivityData) {
      console.log('User Activity Data has been updated:', userActivityData);
    }
  }, [userActivityData]);

  // Function to process chat messages for the messages per hour chart
  const processChatMessages = (messages) => {
    const messageTimes = messages.map(msg => {
      const [hour] = msg.time.split(':');
      return hour ? parseInt(hour, 10) : null;
    }).filter(hour => hour !== null);

    const messageCounts = messageTimes.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const chartData = {
      labels: Array.from({ length: 24 }, (_, i) => i),
      datasets: [
        {
          label: 'Messages per Hour',
          data: Array.from({ length: 24 }, (_, i) => messageCounts[i] || 0),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };

    setMessageData(chartData);
  };

  // Function to process user activity data
  const processUserActivity = (activity) => {
    const filteredActivity = activity.filter(activity => activity.timestamp);
    if (filteredActivity.length !== activity.length) {
      console.warn('Some user activity entries are missing timestamps.');
    }

    const activityCounts = filteredActivity.reduce((acc, activity) => {
      const hour = new Date(activity.timestamp).getHours();
      if (!acc[hour]) acc[hour] = { join: 0, leave: 0 };
      if (activity.event === 'join') acc[hour].join += 1;
      if (activity.event === 'leave') acc[hour].leave += 1;
      return acc;
    }, {});

    console.log('Processed activity counts:', activityCounts); // Debugging log

    const chartData = {
      labels: Array.from({ length: 24 }, (_, i) => i),
      datasets: [
        {
          label: 'User Join Activity',
          data: Array.from({ length: 24 }, (_, i) => activityCounts[i]?.join || 0),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          stack: 'Stack 0',
        },
        {
          label: 'User Leave Activity',
          data: Array.from({ length: 24 }, (_, i) => activityCounts[i]?.leave || 0),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          stack: 'Stack 0',
        },
      ],
    };

    console.log('Generated chart data:', chartData); // Debugging log
    setUserActivityData(chartData);
  };

  // Function to process user messages data with time scales
  const processUserMessages = (messages) => {
    const userMessageCounts = messages.reduce((acc, msg) => {
      const timestamp = new Date(`1970-01-01T${msg.time}Z`).getTime();
      if (!acc[msg.username]) acc[msg.username] = [];
      acc[msg.username].push({ x: timestamp, y: 1 });
      return acc;
    }, {});

    const cumulativeUserMessageCounts = Object.keys(userMessageCounts).reduce((acc, username) => {
      let cumulativeCount = 0;
      acc[username] = userMessageCounts[username].map(point => {
        cumulativeCount += point.y;
        return { x: point.x, y: cumulativeCount };
      });
      return acc;
    }, {});

    const colors = [
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
    ];

    const datasets = Object.keys(cumulativeUserMessageCounts).map((username, index) => ({
      label: username,
      data: cumulativeUserMessageCounts[username],
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length].replace('0.6', '1'),
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      pointRadius: 5,
      pointHoverRadius: 7,
    }));

    const chartData = {
      datasets,
    };

    setUserMessageData(chartData);
  };

  // Initial processing of data
  useEffect(() => {
    processChatMessages(chatMessages);
    processUserActivity(userActivity);
    processUserMessages(chatMessages);
  }, [chatMessages, userActivity]);

  // Periodically update data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      processChatMessages(chatMessages);
      processUserActivity(userActivity);
      processUserMessages(chatMessages);
    }, 300000); // 300000 milliseconds = 5 minutes

    return () => clearInterval(interval);
  }, [chatMessages, userActivity]);

  // Ensure data is ready before rendering
  if (!messageData || !userActivityData || !userMessageData) {
    return <div className="text-center text-white">Loading analytics...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white pt-1">
      <header className="mb-2">
        <h1 className="text-2xl font-bold text-center">Room Analytics</h1>
      </header>
      <div className="flex flex-col w-full max-w-screen-xl mx-auto space-y-4">
        {/* Messages per Hour Chart */}
        {messageData && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Messages per Hour</h2>
            <Line 
              data={messageData} 
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
        )}

        {/* User Join/Leave per Hour Chart */}
        {userActivityData && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">User Join/Leave Activity per Hour</h2>
            <Bar 
              data={userActivityData} 
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
        )}

        {/* Messages Sent by User Over Time Chart */}
        {userMessageData && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Messages Sent by User Over Time</h2>
            <Line 
              data={userMessageData} 
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
                    adapters: {
                      date: {
                        locale: enIN,
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
        )}
      </div>
    </div>
  );
};

export default Analytics;
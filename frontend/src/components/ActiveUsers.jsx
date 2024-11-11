import React, { useEffect, useState } from 'react';
import useIdle from '../utils/useIdle';
import io from 'socket.io-client';
import { FaCircle, FaCrown } from 'react-icons/fa';

const socket = io('http://localhost:5000');

function ActiveUsers({ users = [], currentUsername, leader }) {
  const [userStatuses, setUserStatuses] = useState({});
  const isIdle = useIdle(30000);

  useEffect(() => {
    const initialStatuses = users.reduce((acc, user) => {
      if (user && user.username) {
        acc[user.username] = user.status || 'active';
      }
      return acc;
    }, {});
    setUserStatuses(initialStatuses);
    console.log('Initialized user statuses:', initialStatuses);
  }, [users]);

  useEffect(() => {
    if (currentUsername) {
      const status = isIdle ? 'idle' : 'active';
      setUserStatuses((prevStatuses) => ({
        ...prevStatuses,
        [currentUsername]: status,
      }));
      console.log(`Emitting update_status for ${currentUsername} with status ${status}`);
      socket.emit('update_status', { username: currentUsername, status });
    }
  }, [isIdle, currentUsername]);

  useEffect(() => {
    const handleUpdateUsers = (updatedUsers) => {
      console.log('Received update_users event with data:', updatedUsers);
      setUserStatuses(updatedUsers.reduce((acc, user) => {
        acc[user.username] = user.status || 'active';
        return acc;
      }, {}));
    };

    socket.on('update_users', handleUpdateUsers);

    return () => {
      socket.off('update_users', handleUpdateUsers);
    };
  }, []);

  useEffect(() => {
    console.log('Users array:', users);
    console.log('User statuses:', userStatuses);
  }, [users, userStatuses]);

  return (
    <div className="text-lg mt-6 custom-scrollbar">
      <ul className="space-y-2">
        {users.map((user, index) =>
          user && user.username ? (
            <li key={index} className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="font-semibold text-white">{user.username}</span>
                {user.username === leader && <FaCrown className="text-yellow-500 ml-2" />}
              </div>
              <span className="flex items-center space-x-2">
                <FaCircle className={`text-sm ${userStatuses[user.username] === 'idle' ? 'text-yellow-500' : 'text-green-500'}`} />
                <span className={`text-sm ${userStatuses[user.username] === 'idle' ? 'text-yellow-500' : 'text-green-500'}`}>
                  {userStatuses[user.username] === 'idle' ? 'Idle' : 'Active'}
                </span>
              </span>
            </li>
          ) : null
        )}
      </ul>
    </div>
  );
}

export default ActiveUsers;
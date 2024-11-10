import React, { useEffect, useState } from 'react';
import useIdle from '../utils/useIdle';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function ActiveUsers({ users = [], currentUsername }) {
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
      <ul className="space-y-1">
        {users.map((user, index) =>
          user && user.username ? (
            <li key={index} className="flex items-center justify-between px-2 py-2 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="font-semibold text-white pl-4">{user.username}</span>
              </div>
              <span
                className={`ml-2 text-sm flex items-center pr-4 ${
                  userStatuses[user.username] === 'idle' ? 'text-yellow-500' : 'text-green-500'
                }`}
              >
                {userStatuses[user.username] === 'idle' ? <span className="w-2 h-2 bg-yellow-500 rounded-full inline-block"></span> : <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>}
              </span>
            </li>
          ) : null
        )}
      </ul>
    </div>
  );
}

export default ActiveUsers;

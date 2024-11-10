import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import io from 'socket.io-client';
import axios from 'axios';

const checkRoomExists = async (roomId) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/rooms/exists/${roomId}`);
    return response.data.exists;
  } catch (error) {
    console.error("Error checking room existence:", error);
    return false;
  }
};

function HomePage() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [stage, setStage] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();
  const roomIdFromState = location.state?.roomId;
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3000');  // Replace with your actual server URL
    setSocket(newSocket);

    return () => {
      // Clean up the socket connection on component unmount
      newSocket.disconnect();
    };
  }, []);

  const handleCreateRoom = () => {
    if (!username.trim()) {
      alert('Please enter a username.');
      return;
    }
    
    const newRoomId = uuidv4();
    socket.emit('join room', { roomId: newRoomId, username });
    navigate(`/room/${newRoomId}`, { state: { username } });
  };

  const handleJoinRoom = async () => {
    if (!username.trim()) {
      alert('Please enter a username.');
      return;
    }
    if (!roomId.trim()) {
      alert('Please enter a room ID.');
      return;
    }
  
    const roomExists = await checkRoomExists(roomId);
    if (roomExists) {
      socket.emit('join room', { roomId, username });
      navigate(`/room/${roomId}`, { state: { username } });
    } else {
      alert('Room does not exist.');
    }
  };

  const handleNext = () => {
    if (!username.trim()) {
      alert('Please enter a username.');
      return;
    }

    if (roomIdFromState) {
      navigate(`/room/${roomIdFromState}`, { state: { username } });
    } else {
      setStage(2);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 min-h-screen py-12 px-6">
      <h1 className="text-4xl font-extrabold text-white mb-8 animate__animated animate__fadeIn">
        Welcome to the Room App
      </h1>

      {stage === 1 && (
        <div className="w-full max-w-md space-y-4">
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-4 text-lg rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleNext}
            className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
          >
            Next
          </button>
        </div>
      )}

      {stage === 2 && (
        <div className="w-full max-w-md space-y-4">
          <h2 className="text-2xl font-semibold text-white mb-4">Hi, {username}! What would you like to do?</h2>

          <button
            onClick={handleCreateRoom}
            className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
          >
            Create Room
          </button>

          <div className="flex items-center justify-center space-x-2 my-6">
            <div className="h-px bg-white w-1/4"></div>
            <span className="text-white text-lg">OR</span>
            <div className="h-px bg-white w-1/4"></div>
          </div>

          <div>
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full p-4 text-lg rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            />
            <button
              onClick={handleJoinRoom}
              className="w-full p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-300 ease-in-out"
            >
              Join Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
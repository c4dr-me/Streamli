const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const Message = require('./models/Message');
const Room = require('./models/Room');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true,
}));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/messages', require('./routes/messages'));
app.use('/api/rooms', require('./routes/room'));

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const usersInRooms = {};
const roomLeaders = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle joining a room
  socket.on('join_room', async ({ roomId, username }) => {
    try {
      console.log(`${username} joined room ${roomId}`);

      // Find or create the room in the database
      let room = await Room.findOne({ roomId });
      if (!room) {
        room = new Room({ roomId, users: [] });
        await room.save();
      }

      // Initialize in-memory user list for the room
      if (!usersInRooms[roomId]) {
        usersInRooms[roomId] = [];
      }

      // Add user to in-memory and database lists if not already present
      if (!usersInRooms[roomId].some(user => user.username === username)) {
        usersInRooms[roomId].push({ id: socket.id, username, status: 'active' });
      }
      if (!room.users.includes(username)) {
        room.users.push(username);
        await room.save();
      }

      // Set the leader if not already set
      if (!roomLeaders[roomId]) {
        roomLeaders[roomId] = username;
      }

      socket.join(roomId);
      io.to(roomId).emit('update_users', usersInRooms[roomId]);
      io.to(roomId).emit('leader_changed', roomLeaders[roomId]);

    } catch (error) {
      console.error('Error joining room:', error);
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user_typing', data.username);
  });

  // Handle status updates
  socket.on('update_status', ({ username, status }) => {
    console.log(`Status update for ${username}: ${status}`);

    for (const roomId in usersInRooms) {
      const user = usersInRooms[roomId].find(user => user.username === username);
      if (user) {
        user.status = status;
        console.log(`Updated ${username} status to ${status} in room ${roomId}`);
        io.to(roomId).emit('update_users', usersInRooms[roomId]);
      }
    }
  });

  // Handle sending messages
  socket.on('send_message', async (messageData) => {
    const { username, message, time, roomId } = messageData;
    console.log('Received message:', messageData);

    try {
      const room = await Room.findOne({ roomId });
      if (!room) {
        console.error('Room not found:', roomId);
        return;
      }

      const newMessage = new Message({
        username,
        message,
        time,
        roomId: room._id,
      });
      await newMessage.save();

      io.to(roomId).emit('receive_message', messageData);

    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Handle video sync actions
  socket.on('sync_video', ({ roomId, action, time }) => {
    socket.to(roomId).emit('sync_video', { action, time });
    console.log(`Syncing video for room ${roomId}: ${action} at ${time}`);
  });

  socket.on("video_changed", ({ roomId, VideoId }) => {
    // Broadcast the video change to all clients in the room
    io.to(roomId).emit("sync_video_change", { VideoId });
  });
  

  // Handle user disconnect
  socket.on('disconnect', async () => {
    console.log('A user disconnected:', socket.id);

    for (const roomId in usersInRooms) {
      const userIndex = usersInRooms[roomId].findIndex(user => user.id === socket.id);
      if (userIndex !== -1) {
        const [disconnectedUser] = usersInRooms[roomId].splice(userIndex, 1);
        io.to(roomId).emit('update_users', usersInRooms[roomId]);

        // Handle leader change if the leader disconnects
        if (disconnectedUser.username === roomLeaders[roomId]) {
          if (usersInRooms[roomId].length > 0) {
            roomLeaders[roomId] = usersInRooms[roomId][0].username;
          } else {
            delete roomLeaders[roomId];
          }
          io.to(roomId).emit('leader_changed', roomLeaders[roomId]);
        }

        if (usersInRooms[roomId].length === 0) {
          console.log(`Room ${roomId} is empty. Deleting room and messages.`);
          delete usersInRooms[roomId];
          try {
            await Room.findOneAndDelete({ roomId });
            await Message.deleteMany({ roomId: roomId });
          } catch (error) {
            console.error('Error deleting room or messages:', error);
          }
        }
      }
    }
  });
});

// Start the server
server.listen(5000, () => {
  console.log('Server running on port 5000');
});
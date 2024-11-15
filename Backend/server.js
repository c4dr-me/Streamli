const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const Message = require('./models/Message');
const Room = require('./models/Room');
const UserEvent = require("./models/UserEvent");

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
const disconnectTimers = {}; // To track disconnect timers

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle joining a room
  socket.on('join_room', async ({ roomId, username }) => {
    try {
      console.log(`${username} joined room ${roomId}`);

      // Clear any existing disconnect timer for the user
      if (disconnectTimers[username]) {
        clearTimeout(disconnectTimers[username]);
        delete disconnectTimers[username];
      }

      // Find or create the room in the database
      let room = await Room.findOne({ roomId });
      if (!room) {
        room = new Room({ roomId, users: [] });
        await room.save();
        console.log(`Created new room: ${roomId}`);
      }

      // Initialize in-memory user list for the room
      if (!usersInRooms[roomId]) {
        usersInRooms[roomId] = [];
        console.log(`Initialized user list for room: ${roomId}`);
      }

      // Avoid adding the user if they are already in the room
      if (!usersInRooms[roomId].some(user => user.username === username)) {
        // Add user to the in-memory list
        usersInRooms[roomId].push({ id: socket.id, username, status: 'active' });

        // Add user to the room in the database if not already present
        if (!room.users.includes(username)) {
          room.users.push(username);
          await room.save();
          console.log(`Added ${username} to the room database`);
        }

        // Check if there's an existing user event for the user
        const existingUserEvent = await UserEvent.findOne({ username, roomId, event: 'join' });

        if (existingUserEvent) {
          // If the user already has a join event, update the timestamp
          existingUserEvent.timestamp = new Date();
          await existingUserEvent.save();
          console.log(`Updated timestamp for ${username} joining room ${roomId}`);
        } else {
          // If no previous join event exists, create a new one
          await UserEvent.create({
            username,
            roomId,
            event: 'join',
            timestamp: new Date(),
          });
          console.log(`UserEvent logged: ${username} joined room ${roomId}`);
        }

        // Emit the join event to the room
        io.to(roomId).emit('user_joined', { username, time: new Date().toLocaleTimeString() });
        console.log(`Emitting user_joined for ${username} in room ${roomId}`);
      }

      // Set the room leader if not already set
      if (!roomLeaders[roomId]) {
        roomLeaders[roomId] = username;
        console.log(`Setting ${username} as the room leader for ${roomId}`);
      }

      socket.join(roomId); // Join the room in socket.io
      io.to(roomId).emit('update_users', usersInRooms[roomId]);
      io.to(roomId).emit('leader_changed', roomLeaders[roomId]);

    } catch (error) {
      console.error('Error in join_room:', error);
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    console.log(`Received 'typing' from ${data.username} in room ${data.roomId}`);
    socket.to(data.roomId).emit('user_typing', data.username);
  });

  // Handle status updates
  socket.on('update_status', ({ username, status }) => {
    console.log(`Received status update for ${username}: ${status}`);

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
      console.log(`Emitted message to room ${roomId}`);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Handle video sync actions
  socket.on('sync_video', ({ roomId, action, time }) => {
    console.log(`Received 'sync_video' for room ${roomId}: ${action} at ${time}`);
    socket.to(roomId).emit('sync_video', { action, time });
  });

  socket.on('video_changed', ({ roomId, videoId }) => {
    console.log(`Received 'video_changed' for room ${roomId}: VideoId ${videoId}`);
    try{
      if (videoId) {
        io.to(roomId).emit("sync_video_change", { videoId});
      } else {
        console.error("Video ID is undefined or invalid.");
      }
    }catch(err){
      console.log(err);
    }
  });
  

  // Handle user disconnect
  socket.on('disconnect', async () => {
    console.log('A user disconnected:', socket.id);
    console.log('Current users in rooms:', JSON.stringify(usersInRooms, null, 2));

    for (const roomId in usersInRooms) {
      const userIndex = usersInRooms[roomId].findIndex(user => user.id === socket.id);
      if (userIndex !== -1) {
        const [disconnectedUser] = usersInRooms[roomId].splice(userIndex, 1);

        // Set a timer to log the leave event after a delay
        disconnectTimers[disconnectedUser.username] = setTimeout(async () => {
          try {
            await UserEvent.create({
              username: disconnectedUser.username,
              roomId,
              event: "leave",
              timestamp: new Date(),
            });
            console.log(`UserEvent logged: ${disconnectedUser.username} left room ${roomId}`);
          } catch (logError) {
            console.error("Error logging user leave event:", logError);
          }

          // Emit user left and update users in the room
          io.to(roomId).emit('update_users', usersInRooms[roomId]);
          io.to(roomId).emit('user_left', { username: disconnectedUser.username, time: new Date().toLocaleTimeString() });
          console.log(`Emitting user_left for ${disconnectedUser.username} in room ${roomId}`);

          // Handle leader change if the disconnected user was the leader
          if (disconnectedUser.username === roomLeaders[roomId]) {
            // roomLeaders[roomId] = usersInRooms[roomId][0]?.username || null;
            if (usersInRooms[roomId] && usersInRooms[roomId].length > 0) {
              roomLeaders[roomId] = usersInRooms[roomId][0].username;
            } else {
              roomLeaders[roomId] = null;
            }
            io.to(roomId).emit('leader_changed', roomLeaders[roomId]);
            console.log(`Leader changed for room ${roomId}, new leader: ${roomLeaders[roomId]}`);
          }

          // Room deletion logic
          if (usersInRooms[roomId].length === 0) {
            console.log(`Room ${roomId} is empty. Deleting room and messages.`);
            delete usersInRooms[roomId];
            try {
              await Room.findOneAndDelete({ roomId });
              await Message.deleteMany({ roomId });
              await UserEvent.deleteMany({ roomId });
              console.log(`Room ${roomId} and associated messages/events deleted.`);
            } catch (error) {
              console.error('Error deleting room or messages:', error);
            }
          }
        }, 5000); // 5-second delay to check for reconnections
      }
    }
  });
});

// Start the server
server.listen(5000, () => {
  console.log('Server running on port 5000');
});
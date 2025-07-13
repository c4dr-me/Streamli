const Message = require('./models/Message');
const Room = require('./models/Room');
const UserEvent = require('./models/UserEvent');
const axios = require('axios');

const usersInRooms = {};
const roomLeaders = {};
const disconnectTimers = {};

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle joining a room
    socket.on('join_room', async ({ roomId, username }) => {
      try {
        console.log(`${username} joined room ${roomId}`);

        if (disconnectTimers[username]) {
          clearTimeout(disconnectTimers[username]);
          delete disconnectTimers[username];
        }

        let room = await Room.findOne({ roomId });
        if (!room) {
          room = new Room({ roomId, users: [] });
          await room.save();
          console.log(`Created new room: ${roomId}`);
        }

        if (!usersInRooms[roomId]) {
          usersInRooms[roomId] = [];
          console.log(`Initialized user list for room: ${roomId}`);
        }

        if (!usersInRooms[roomId].some(user => user.username === username)) {
          usersInRooms[roomId].push({ id: socket.id, username, status: 'active' });

          if (!room.users.includes(username)) {
            room.users.push(username);
            await room.save();
            console.log(`Added ${username} to the room database`);
          }

          const existingUserEvent = await UserEvent.findOne({ username, roomId, event: 'join' });
          if (existingUserEvent) {
            existingUserEvent.timestamp = new Date();
            await existingUserEvent.save();
            console.log(`Updated timestamp for ${username} joining room ${roomId}`);
          } else {
            await UserEvent.create({ username, roomId, event: 'join', timestamp: new Date() });
            console.log(`UserEvent logged: ${username} joined room ${roomId}`);
          }

          io.to(roomId).emit('user_joined', { username, time: new Date().toLocaleTimeString() });
          console.log(`Emitting user_joined for ${username} in room ${roomId}`);
        }

        if (!roomLeaders[roomId]) {
          roomLeaders[roomId] = username;
          console.log(`Setting ${username} as the room leader for ${roomId}`);
        }

        socket.join(roomId);
        io.to(roomId).emit('update_users', usersInRooms[roomId]);
        io.to(roomId).emit('leader_changed', roomLeaders[roomId]);
      } catch (error) {
        console.error('Error in join_room:', error);
      }
    });

    socket.on('typing', (data) => {
      console.log(`Received 'typing' from ${data.username} in room ${data.roomId}`);
      socket.to(data.roomId).emit('user_typing', data.username);
    });

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

    socket.on('send_message', async (messageData) => {
      const { username, message, time, roomId } = messageData;
      console.log('Received message:', messageData);
      try {
        const response = await axios.post('http://localhost:5001/predict', { comment: message });
        const { toxic } = response.data;
        const messageWithToxicFlag = { ...messageData, isToxic: toxic };
        if (toxic) {
          io.to(socket.id).emit('receive_message', messageWithToxicFlag);
          console.log('Message blocked due to toxicity');
          return;
        } else {
          io.to(roomId).emit('receive_message', messageWithToxicFlag);
        }
        const room = await Room.findOne({ roomId });
        if (!room) {
          console.error('Room not found:', roomId);
          return;
        }
        const newMessage = new Message({ username, message, time, roomId: room._id });
        await newMessage.save();
        console.log(`Emitted message to room ${roomId}`);
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });

    socket.on('sync_video', ({ roomId, action, time }) => {
      console.log(`Received 'sync_video' for room ${roomId}: ${action} at ${time}`);
      socket.to(roomId).emit('sync_video', { action, time });
    });

    socket.on('video_changed', ({ roomId, videoId }) => {
      console.log(`Received 'video_changed' for room ${roomId}: VideoId ${videoId}`);
      try {
        if (videoId) {
          io.to(roomId).emit('sync_video_change', { videoId });
        } else {
          console.error('Video ID is undefined or invalid.');
        }
      } catch (err) {
        console.log(err);
      }
    });

    socket.on('emoji_reaction', (emojiData) => {
      try {
        const { roomId, emojis } = emojiData;
        console.log(`Received 'emoji_reaction' for room ${roomId}:  ${JSON.stringify(emojis)}`);
        io.to(roomId).emit('emoji_reaction', emojis);
      } catch (err) {
        console.log(err);
      }
    });

    socket.on('disconnect', async () => {
      console.log('A user disconnected:', socket.id);
      console.log('Current users in rooms:', JSON.stringify(usersInRooms, null, 2));
      for (const roomId in usersInRooms) {
        const userIndex = usersInRooms[roomId].findIndex(user => user.id === socket.id);
        if (userIndex !== -1) {
          const [disconnectedUser] = usersInRooms[roomId].splice(userIndex, 1);
          disconnectTimers[disconnectedUser.username] = setTimeout(async () => {
            try {
              await UserEvent.create({ username: disconnectedUser.username, roomId, event: 'leave', timestamp: new Date() });
              console.log(`UserEvent logged: ${disconnectedUser.username} left room ${roomId}`);
            } catch (logError) {
              console.error('Error logging user leave event:', logError);
            }
            io.to(roomId).emit('update_users', usersInRooms[roomId]);
            io.to(roomId).emit('user_left', { username: disconnectedUser.username, time: new Date().toLocaleTimeString() });
            console.log(`Emitting user_left for ${disconnectedUser.username} in room ${roomId}`);
            if (disconnectedUser.username === roomLeaders[roomId]) {
              if (usersInRooms[roomId] && usersInRooms[roomId].length > 0) {
                roomLeaders[roomId] = usersInRooms[roomId][0].username;
              } else {
                roomLeaders[roomId] = null;
              }
              io.to(roomId).emit('leader_changed', roomLeaders[roomId]);
              console.log(`Leader changed for room ${roomId}, new leader: ${roomLeaders[roomId]}`);
            }
            if (usersInRooms[roomId] && usersInRooms[roomId].length === 0) {
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
          }, 5000);
        }
      }
    });
  });
}

module.exports = { setupSocket };

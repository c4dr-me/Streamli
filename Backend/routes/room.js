// routes/rooms.js
const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const UserEvent = require('../models/UserEvent');

// Create a new room
router.post('/create', async (req, res) => {
  try {
    const { roomId } = req.body;

    // Check if room already exists
    const existingRoom = await Room.findOne({ roomId });
    if (existingRoom) {
      return res.status(400).json({ error: 'Room already exists' });
    }

    const newRoom = new Room({ roomId, users: [] });
    await newRoom.save();
    res.status(201).json({ message: 'Room created successfully', roomId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Join a room
router.post('/join', async (req, res) => {
  const { roomId, username } = req.body;

  if (!roomId || !username) {
    return res.status(400).json({ error: 'Missing roomId or username' });
  }

  try {
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.users.includes(username)) {
      return res.status(400).json({ error: 'User already in the room' });
    }

    await Room.updateOne({ roomId }, { $addToSet: { users: username } });

    const userEvent = new UserEvent({ username, roomId, event: 'join' });
    await userEvent.save();

    res.status(200).json({ message: `${username} joined the room ${roomId}` });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Check if a room exists
router.get('/exists/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });
    
    if (room) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(404).json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to check room existence' });
  }
});

// Join Room
// router.post('/joinRoom', async (req, res) => {
//   const { roomId, username } = req.body;

//   try {
//     const userEvent = new UserEvent({ username, roomId, event: 'join' });
//     await userEvent.save();
//     console.log(`User event logged: ${username} joined room ${roomId}`);
//     res.status(200).json({ message: `${username} joined the room ${roomId}` });
//   } catch (error) {
//     console.error('Error logging join event:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// Leave Room
router.post('/leaveRoom', async (req, res) => {
  const { roomId, username } = req.body;

  try {
    const userEvent = new UserEvent({ username, roomId, event: 'leave' });
    await userEvent.save();
    console.log(`User event logged: ${username} left room ${roomId}`);
    res.status(200).json({ message: `${username} left the room ${roomId}` });
  } catch (error) {
    console.error('Error logging leave event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Fetch user events for a room
router.get('/userEvents/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log("Received roomId:", roomId);
    const events = await UserEvent.find({ roomId });
    console.log(events);
    if (events.length > 0) {
      return res.status(200).json(events);
    } else {
      return res.status(404).json({ message: 'No user events found' });
    }
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
});


module.exports = router;

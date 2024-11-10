// routes/rooms.js
const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

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
  try {
    const { roomId, username } = req.body;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.users.includes(username)) {
      return res.status(400).json({ error: 'User already in the room' });
    }

    room.users.push(username);
    await room.save();
    res.status(200).json({ message: 'User added to room' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join room' });
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


module.exports = router;

// routes/messages.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const Message = require('../models/Message');
const Room = require('../models/Room');

// Get all messages
router.get('/', messageController.getMessages);

// Post a new message
router.post('/', async (req, res) => {
  try {
    await messageController.createMessage(req.body);
    res.status(201).send('Message saved');
  } catch (error) {
    res.status(500).json({ error: 'Failed to save message' });
  }
});

//Getting messages 
router.get('/:roomId', async (req, res) => {
  try {
    // Check if the room exists
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Fetch messages for the room
    const messages = await Message.find({ roomId: room._id }).populate('roomId');
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error); // Log the error for debugging
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

module.exports = router;

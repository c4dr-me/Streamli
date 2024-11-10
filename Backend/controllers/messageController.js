// controllers/messageController.js
const Message = require('../models/Message');

// Fetch all messages from the database
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Save a new message to the database
exports.createMessage = async (data) => {
  try {
    const newMessage = new Message(data);
    await newMessage.save();
    console.log('Message saved to database');
  } catch (error) {
    console.error('Error saving message:', error);
  }
};

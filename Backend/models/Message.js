// models/Message.js
const mongoose = require('mongoose');

// Define the Message schema
const messageSchema = new mongoose.Schema({
  username: { type: String, required: true },
  message: { type: String, required: true },
  time: { type: String, required: true },
  roomId: { type: String, required: true },
});

// Create and export the Message model
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;

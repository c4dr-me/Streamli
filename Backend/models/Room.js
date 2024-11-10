// models/Room.js
const mongoose = require('mongoose');

// Define the Room schema
const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  users: [{ type: String }],  // List of users in the room
});

// Create and export the Room model
const Room = mongoose.model('Room', roomSchema);

module.exports = Room;

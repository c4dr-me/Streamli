
const mongoose = require('mongoose');


const userEventSchema = new mongoose.Schema({
  username: { type: String, required: true },  
  roomId: { type: String, required: true },   
  event: { type: String, enum: ['join', 'leave'], required: true }, 
  timestamp: { type: Date, default: Date.now }, 
});


const UserEvent = mongoose.model('UserEvent', userEventSchema);

module.exports = UserEvent;

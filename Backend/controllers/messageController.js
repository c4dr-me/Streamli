const Message = require('../models/Message');


exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

exports.createMessage = async (data) => {
  try {
    const newMessage = new Message(data);
    await newMessage.save();
    console.log('Message saved to database');
  } catch (error) {
    console.error('Error saving message:', error);
  }
};

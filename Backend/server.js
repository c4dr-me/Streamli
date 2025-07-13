const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { setupSocket } = require('./socket');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true,
}));

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


setupSocket(io);

server.listen(5000, () => {
  console.log('Server running on port 5000');
});
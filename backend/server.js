const express = require('express');
const http = require('http');
const cors = require('cors');
const { initializeWebSocket } = require('./websocket');

const app = express();
app.use(express.json());

// ✅ Allow localhost and EC2 frontend origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://44.213.76.187:3000',
];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

const server = http.createServer(app);
initializeWebSocket(server);

const userRoutes = require('./routes/userRoutes');
const socialRoutes = require('./routes/socialRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/users', userRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

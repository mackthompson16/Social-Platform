const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 4000 });
const db = require('./db');

// Broadcast inbox updates to all connected clients
db.on('inbox_update', (updatedInbox) => {
  const message = JSON.stringify({ type: 'inbox_update', inbox: updatedInbox });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

// Handle new client connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log('WebSocket server is running on ws://localhost:4000');


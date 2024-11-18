const WebSocket = require('ws');
let wss = null;

function initializeWebSocket(server) {
    
    wss = new WebSocket.Server({ server });
    console.log('WebSocket server initialized.');


   
    wss.on('connection', (ws) => {
        console.log('Client connected to WebSocket server.');

        ws.on('message', (data) => {
        
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });
        });

        ws.on('close', () => {
            console.log('Client disconnected from WebSocket server.');
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });
}

function getWebSocketServer() {
    if (!wss) {
        throw new Error("WebSocket server is not initialized!");
    }
    return wss;
}


module.exports = { initializeWebSocket, getWebSocketServer };

const WebSocket = require('ws');
const clientMap = new Map();

function initializeWebSocket(server) {
    
    const wss = new WebSocket.Server({ server });
    console.log('WebSocket server initialized.');
    

   
    wss.on('connection', (ws) => {
        console.log('Client connected to WebSocket server.');
        
        ws.id = null;
    
     
        ws.on('message', (rawData) => {
            try {
                const data = JSON.parse(rawData);
                if (data.type === 'login'&& data.id) {
                    // Normalize to number so lookups work consistently
                    ws.id = Number(data.id); 
                    clientMap.set(ws.id, ws); 
                    console.log(`Client logged in with ID: ${ws.id}`);
                } else {
                  
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(rawData); 
                    }
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });
    
        // Handle client disconnection
        ws.on('close', () => {
            console.log('Client disconnected from WebSocket server.');
            if (ws.id !== null) {
                clientMap.delete(ws.id); // Remove client from map
            }
        });
    
        // Handle WebSocket errors
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });
}  




module.exports = { initializeWebSocket, clientMap };

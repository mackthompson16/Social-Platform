const express = require('express');
const router = express.Router();
const db= require('../db');
const { clientMap } = require('../websocket');
const WebSocket = require('ws')
const sendNotificationToClient = (recipient_id, notification) => {
    const client = clientMap.get(Number(recipient_id)); // Get the client by ID
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notification)); // Send the notification
        console.log(`Notification sent to client ${recipient_id}:`, notification);
    } else {
        console.warn(`Client with ID ${recipient_id} is not connected or unavailable.`);
    }
};

router.get('/get-users', (req, res) => {
    db.all(`SELECT id, username FROM users`, [], (err, rows) => {
        if (err) {
            console.error('Error retrieving users:', err);
            return res.status(500).json({ success: false, message: 'Database query failed' });
        }
        res.json({ success: true, users: rows });
    });
});


router.get('/:id/get-friends', async (req, res) => {
    const user_id = parseInt(req.params.id, 10);

    try {
        db.all(
            `
            SELECT u.id, u.username
            FROM friends f
            JOIN users u ON (u.id = f.user1_id AND f.user2_id = ?)
                        OR (u.id = f.user2_id AND f.user1_id = ?)
            `,
            [user_id, user_id],
            (err, rows) => {
                if (err) {
                    console.error('Error retrieving friends:', err);
                    return res.status(500).json({ success: false, message: 'Database query failed' });
                }

                res.json(rows); // Returns an array of { id, username } objects
            }
        );
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});



  router.get('/:id/get-messages', async (req, res) => {
    const user_id = req.params.id
    try {
        db.all(`SELECT * FROM inbox where recipient_id = ?`, [user_id], (err, inbox) => {
            if (err) {
                console.error('Error retrieving inbox:', err);
                return res.status(500).json({ success: false, message: 'Database query failed' });
            }
           
            res.json(inbox);
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
  });

router.get('/:user_id/pending-requests', (req, res) => {
    const { user_id } = req.params;

    const query = `
        SELECT recipient_id FROM inbox 
        WHERE sender_id = ? AND type = 'friend_request' AND status = 'unread'
    `;

    db.all(query, [user_id], (err, rows) => {
        if (err) {
            console.error('Error fetching pending requests:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch pending requests' });
        }

        const recipientIds = rows.map(row => row.recipient_id);
        res.json({ success: true, pendingRequests: recipientIds });
    });
});


router.post('/:recipient_id/:sender_id/update-request', async (req, res) => {
    const { recipient_id, sender_id } = req.params; // Extract from URL parameters
    const { request, action, recipient_username } = req.body; // Extract from request body

    if(action ==='accept'){
        if (request.type === 'friend_request'){
        
    //insert into table. ChatGPT said I need to put the higher ID first
    
        const [smallerId, largerId] = recipient_id < sender_id
            ? [recipient_id, sender_id]
            : [sender_id, recipient_id];
    
            db.run(
                `INSERT INTO friends (user1_id, user2_id) VALUES (?, ?)`,
                [smallerId, largerId],
                (err) => {
                    if (err) {
                        console.error('Error inserting friendship:', err.message);
                    } else {
                        console.log('Friendship added successfully.');
                    }
                }
            );
    

                    
    // send updated friends to clients 

        const friend_update = {
            type: 'friend_update',
            recipient_id,
            recipient_username
        }

        sendNotificationToClient(sender_id,friend_update);

              
            }

        if(request.type === 'meeting_request'){
        //add commitment into both users tables
            db.run(`INSERT INTO commitments (user_id, name, startTime, endTime, days, dates) 
                    VALUES (?, ?, ?, ?, ?, ?)`, [recipient_id,...request.content])
            db.run(`INSERT INTO commitments (user_id, name, startTime, endTime, days, dates) 
                VALUES (?, ?, ?, ?, ?, ?)`, [sender_id,...request.content])
            
                    //send this commitment update to client
                    
                const commitment_update = {
                    type: 'commitment_update',
                    commitment
                }

               sendNotificationToClient(sender_id,commitment_update);
    }}
    

        //update the original request in the table
      
        db.get(`UPDATE inbox SET status = ?  WHERE message_id = ? RETURNING *`,
            [`${action}ed`, request.message_id],
            (err, row) => {
              if (err) {
                console.error('Error updating inbox:', err);
                return;
              }
          
              if (row) {
                const inbox_update = {
                  type: 'inbox_update',
                  message: row,
                };
           
                //send inbox update to change status
                
                sendNotificationToClient(recipient_id,inbox_update);

              } else {
                console.warn('No row found with message_id:', request.message_id);
              }
            }
          );
          

        
    res.json({success:true})

    });
        

router.post('/:sender_id/:recipient_id/send-message', (req, res) => {
    const { sender_id, recipient_id } = req.params;
    const { type, content } = req.body;
    const message = {
        recipient_id, sender_id, status:'unread', type, content
    }
    //update inbox database
    db.run(
        `INSERT INTO inbox (recipient_id, sender_id, status, type, content) VALUES (?, ?, ?, ?, ?)`,
        Object.values(message),
        function (err) { // Use a regular function to access `this`
            if (err) {
                console.error('Error inserting into inbox:', err.message);
            } else {
               
    
                // Access the lastID from this context
                const message_id = String(this.lastID);
    
                // Prepare the notification object
                const notification = {
                    type: 'message',
                    message: { ...message, message_id },
                };
    
                // Send notification to WebSocket clients

                sendNotificationToClient(recipient_id,notification);
    
               
            }
        }
    );
    

    

        res.json({ success: true, });

});


module.exports = router;
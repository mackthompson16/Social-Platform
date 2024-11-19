const express = require('express');
const router = express.Router();
const db= require('../db');
const { getWebSocketServer } = require('../websocket');


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
    const user_id = req.params
    try {
        db.all(`SELECT friend_id FROM friends where user_id = ?`, [user_id], (err, friends) => {
            if (err) {
                console.error('Error retrieving friends:', err);
                return res.status(500).json({ success: false, message: 'Database query failed' });
            }
           
            res.json(friends);
        });
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
    const { request, action } = req.body; // Extract from request body

    const wss = getWebSocketServer();
    let sender_username = null;
    let recipient_username = null;

    //retrieve usernames
   
    db.all(
        `SELECT id, username FROM users WHERE id IN (?, ?)`,
        [sender_id, recipient_id],
        (err, rows) => {
          if (err) {
            console.error('Error retrieving usernames:', err.message);
            return;
          }
    
        sender_username = rows.find(row => row.id === sender_id)?.username;
        recipient_username = rows.find(row => row.id === recipient_id)?.username;

    });

    if(action ==='accept'){
        if (request.type === 'friend_request'){
        
    //insert into table
        db.run(
            `INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)`,
            [sender_id, recipient_id]
        );
            
    // send updated friends to clients 

        const friend_update = {
            type: 'friend_update',
            sender_id, recipient_id,
            sender_username,
            recipient_username
        }

        wss.clients.forEach((client) => {
            if (client.readyState === wss.OPEN) {
                client.send(JSON.stringify(friend_update)); 
            }
        });

              
            }

        if(request.type === 'meeting_request'){
        //add commitment into both users tables
            db.run(`INSERT INTO commitments (user_id, name, startTime, endTime, days, dates) 
                    VALUES (?, ?, ?, ?, ?, ?)`, [recipient_id,...message.content])
            db.run(`INSERT INTO commitments (user_id, name, startTime, endTime, days, dates) 
                VALUES (?, ?, ?, ?, ?, ?)`, [sender_id,...message.content])
            
                    //send this commitment update to client

                const commitment_update = {
                    type: 'commitment_update',
                    sender_id, recipient_id,
                    commitment
                }

                wss.clients.forEach((client) => {
                    if (client.readyState === wss.OPEN) {
                        client.send(JSON.stringify(commitment_update)); 
                    }
                });
    }}
    

        //update the original request in the table

        db.run(`UPDATE inbox SET status = ? WHERE message_id = ?`,[`${action}ed`,request.message_id]);

        
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
        (err) => {
            if (err) {
                console.error('Error inserting into inbox:', err.message);
            } else {
                console.log('Message successfully inserted into inbox.');
            }
        });
    
   //send notification to websocket
    const notification = 
    { 
        type: 'inbox_update',
        message
    };
    console.log('sending,', message.content,'to clients')
    const wss = getWebSocketServer();
    
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(notification));
                    
                }
    });

        res.json({ success: true, });

});


module.exports = router;
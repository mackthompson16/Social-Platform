const express = require('express');
const router = express.Router();
const db= require('../db');


router.get('/get-users', (req, res) => {
    db.all(`SELECT id, username FROM users`, [], (err, rows) => {
        if (err) {
            console.error('Error retrieving users:', err);
            return res.status(500).json({ success: false, message: 'Database query failed' });
        }
        res.json({ success: true, users: rows });
    });
});

// Route to get pending friend requests sent by a user
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


router.post('/accept-meeting-request', async (req, res) => {
    const { message_id, user_id } = req.body;

    try {
        // Step 1: Fetch the inbox message with commitment details
        db.get(
            `SELECT sender_id, content, sender_username FROM inbox WHERE message_id = ? AND recipient_id = ? AND type = 'meeting_request'`,
            [message_id, user_id, username],
            (err, row) => {
                if (err) {
                    console.error('Error fetching meeting request:', err);
                    return res.status(500).json({ success: false, message: 'Failed to retrieve meeting request' });
                }
                
                if (!row) {
                    return res.status(404).json({ success: false, message: 'Meeting request not found' });
                }

                // Step 2: Parse the commitment details from the content
                const commitment = JSON.parse(row.content); // Assuming content is stored as JSON string
                const { name, startTime, endTime, days, dates } = commitment;
                const friend_id = row.sender_id;

                // Step 3: Insert the commitment for both the recipient (user_id) and the sender (friend_id)
                const insertCommitment = (userId, callback) => {
                    db.run(
                        `INSERT INTO commitments (user_id, name, startTime, endTime, days, dates) VALUES (?, ?, ?, ?, ?, ?)`,
                        [userId, name, startTime, endTime, days, dates],
                        callback
                    );
                };

                // Insert commitment for the first user
                insertCommitment(user_id, (err) => {
                    if (err) {
                        console.error('Error adding commitment for user:', err);
                        return res.status(500).json({ success: false, message: 'Failed to add commitment' });
                    }

                    // Insert commitment for the second user (friend)
                    insertCommitment(friend_id, (err) => {
                        if (err) {
                            console.error('Error adding commitment for friend:', err);
                            return res.status(500).json({ success: false, message: 'Failed to add commitment for friend' });
                        }

                        // Step 4: Update inbox message status to 'accepted'
                        db.run(
                            `UPDATE inbox SET status = 'accepted' WHERE message_id = ?`,
                            [messageId],
                            (err) => {
                                if (err) {
                                    console.error('Error updating inbox message status:', err);
                                    return res.status(500).json({ success: false, message: 'Failed to update inbox message' });
                                }

                                // Respond with success and commitment data
                                res.json({ success: true, commitment });
                            }
                        );



                    });

                });
                
                db.run(
                    `INSERT INTO inbox (recipient_id, sender_id, sender_username, status, type, content)
                     VALUES (?, ?, ?, 'unread', 'message', ?)`,
                    [friend_id, user_id, username,'unread', 'message', 'accepted your meeting request'],
                    (err) => {
                        if (err) {
                            console.error('Error inserting notification message:', err);
                            return res.status(500).json({ success: false, message: 'Failed to send notification' });
                        }
                        res.json({ success: true });
                    }
                );

            }
        );
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/accept-friend-request', async (req, res) => {
    const { sender_id, recipient_id, recipient_username } = req.body;
    console.log(sender_id, recipient_id)
    try {
        // Insert the friend relationship
        db.run(
            `INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)`,
            [sender_id, recipient_id, recipient_id, sender_id],
            (err) => {
                if (err) {
                    console.error('Error adding friends:', err);
                    return res.status(500).json({ success: false, message: 'Failed to add friends' });
                }

                // After adding friends, insert the notification message into the inbox
                

                db.run(
                    `INSERT INTO inbox (recipient_id, sender_id, sender_username,status, type, content)
                     VALUES (?, ?, ?, ? ,?,?)`,
                    [sender_id, recipient_id, recipient_username, 'unread' ,'message','accepted your friend request'],
                        (err) => {
                        if (err) {
                            console.error('Error inserting inbox message:', err);
                            return res.status(500).json({ success: false, message: 'Failed to send notification' });
                        }


                    }
                );

                db.run(
                    `UPDATE inbox SET status = ? WHERE sender_id = ? and recipient_id = ? and type = ?`,
                    ['accepted', sender_id, recipient_id, 'friend_request'],
                    (err) => {
                        if (err) {
                            console.error('Error updating inbox message:', err);
                            return res.status(500).json({ success: false, message: 'Failed to update notification' });
                        }
                       
                    }
                );
            
                console.log(sender_id, ' and ', recipient_id, ' are friends.')
                
            }
        );
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
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

// POST endpoint to send a message
router.post('/:sender_id/:recipient_id/send-message', (req, res) => {
    const { sender_id, recipient_id } = req.params;
    const { type, sender_username, content } = req.body;

    // Validate the message type
    const validTypes = ['friend_request', 'message', 'meeting_request'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid message type' });
    }

    // Insert the new message into the inbox table
    const query = `
        INSERT INTO inbox (recipient_id, sender_id, status, type, content, sender_username)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [recipient_id, sender_id,'unread',type, content,sender_username];

    db.run(query, params, function (err) {
        if (err) {
            console.error('Error inserting message:', err);
            return res.status(500).json({ success: false, message: 'Failed to send message' });
        }


        const updatedInbox = { 
            message_id: this.lastID, 
            sender_id, 
            recipient_id, 
            type, 
            content,
            sender_username, 
            status:'unread' 
        };
        db.emit('inbox_update', updatedInbox);

        
        res.json({
            success: true,
            message: 'Message sent successfully',
            message_id: this.lastID 
        });
    });

    


});

module.exports = router;
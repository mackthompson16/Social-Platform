const express = require('express');
const router = express.Router();
const db= require('../db');


router.get('/get-users', async (res) => {
    try {
        db.all(`SELECT user_Id, username FROM users`, [], (err, rows) => {
            if (err) {
                console.error('Error retrieving users:', err);
                return res.status(500).json({ success: false, message: 'Database query failed' });
            }
            // Respond with the list of users
            res.json({ success: true, users: rows });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
  });

router.post('/accept-friend-request', async (req, res) => {
    const { user_Id, friend_Id } = req.body;

    try {
        db.run(
            `INSERT INTO friends (user_Id, friend_Id) VALUES (?, ?), (?, ?)`,
            [user_Id, friend_Id, friend_Id, user_Id],
            (err) => {
                if (err) {
                    console.error('Error adding friends:', err);
                    return res.status(500).json({ success: false, message: 'Failed to add friends' });
                }
                res.json({ success: true });
            }
        );
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

  router.get('/:user_Id/get-friends', async (req, res) => {
    const user_Id = req.params.user_Id
    try {
        db.all(`SELECT friend_Id FROM friends where user_Id = ?`, [user_Id], (err, friends) => {
            if (err) {
                console.error('Error retrieving friends:', err);
                return res.status(500).json({ success: false, message: 'Database query failed' });
            }
           
            res.json({ success: true, friends: friends });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  router.get('/:user_Id/get-messages', async (req, res) => {
    const user_Id = req.params.user_Id
    try {
        db.all(`SELECT * FROM inbox where recipient_Id = ?`, [user_Id], (err, inbox) => {
            if (err) {
                console.error('Error retrieving inbox:', err);
                return res.status(500).json({ success: false, message: 'Database query failed' });
            }
           
            res.json({ success: true, friends: inbox });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
  });

// POST endpoint to send a message
router.post('/:sender_Id/:recipient_Id/send-message', (req, res) => {
    const { sender_Id, recipient_Id } = req.params;
    const { type, content } = req.body;

    // Validate the message type
    const validTypes = ['friend_request', 'message', 'meeting_request'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid message type' });
    }

    // Insert the new message into the inbox table
    const query = `
        INSERT INTO inbox (recipient_Id, sender_Id, read, type, content)
        VALUES (?, ?, 0, ?, ?)
    `;
    const params = [recipient_Id, sender_Id, type, content];

    db.run(query, params, function (err) {
        if (err) {
            console.error('Error inserting message:', err);
            return res.status(500).json({ success: false, message: 'Failed to send message' });
        }

        res.json({
            success: true,
            message: 'Message sent successfully',
            message_Id: this.lastID 
        });
    });
});

module.exports = router;
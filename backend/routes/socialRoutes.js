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


router.post('/accept-friend-request', async (req, res) => {
    const { user_id, friend_id } = req.body;

    try {
        db.run(
            `INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)`,
            [user_id, friend_id, friend_id, user_id],
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

  router.get('/:id/get-friends', async (req, res) => {
    const user_id = req.params.id
    try {
        db.all(`SELECT friend_id FROM friends where user_id = ?`, [user_id], (err, friends) => {
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

  router.get('/:id/get-messages', async (req, res) => {
    const user_Id = req.params.id
    try {
        db.all(`SELECT * FROM inbox where recipient_id = ?`, [user_id], (err, inbox) => {
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
router.post('/:sender_id/:recipient_id/send-message', (req, res) => {
    const { sender_id, recipient_id } = req.params;
    const { type, content } = req.body;

    // Validate the message type
    const validTypes = ['friend_request', 'message', 'meeting_request'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid message type' });
    }

    // Insert the new message into the inbox table
    const query = `
        INSERT INTO inbox (recipient_id, sender_id, read, type, content)
        VALUES (?, ?, 0, ?, ?)
    `;
    const params = [recipient_id, sender_id, type, content];

    db.run(query, params, function (err) {
        if (err) {
            console.error('Error inserting message:', err);
            return res.status(500).json({ success: false, message: 'Failed to send message' });
        }

        res.json({
            success: true,
            message: 'Message sent successfully',
            message_id: this.lastID 
        });
    });
});

module.exports = router;
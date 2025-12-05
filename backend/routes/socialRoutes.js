const express = require('express');
const router = express.Router();
const db = require('../db');
const { clientMap } = require('../websocket');
const WebSocket = require('ws');

const sendNotificationToClient = (recipientId, notification) => {
  const client = clientMap.get(Number(recipientId));
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(notification));
    console.log(`Notification sent to client ${recipientId}:`, notification);
  } else {
    console.warn(`Client with ID ${recipientId} is not connected or unavailable.`);
  }
};

router.get('/get-users', async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT id, username FROM users');
    res.json({ success: true, users: rows });
  } catch (err) {
    console.error('Error retrieving users:', err);
    res.status(500).json({ success: false, message: 'Database query failed' });
  }
});

router.get('/:id/get-meetings', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  try {
    const [owned, invited] = await Promise.all([
      db.query('SELECT * FROM meeting_invites WHERE owner_id = $1', [userId]),
      db.query('SELECT * FROM meeting_invites WHERE member_id = $1', [userId]),
    ]);
    res.json({
      success: true,
      owned_meetings: owned.rows,
      invited_meetings: invited.rows,
    });
  } catch (err) {
    console.error('Error retrieving meetings:', err);
    res.status(500).json({ success: false, message: 'Database query failed' });
  }
});

router.get('/:id/get-friends', async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  try {
    const { rows } = await db.query(
      `
        SELECT u.id, u.username
        FROM friends f
        JOIN users u ON (u.id = f.user1_id AND f.user2_id = $1)
                    OR (u.id = f.user2_id AND f.user1_id = $1)
      `,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error retrieving friends:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id/get-messages', async (req, res) => {
  const userId = req.params.id;
  try {
    const { rows } = await db.query(
      'SELECT * FROM inbox WHERE recipient_id = $1',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error retrieving inbox:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:user_id/pending-requests', async (req, res) => {
  const { user_id } = req.params;

  try {
    const { rows } = await db.query(
      `SELECT recipient_id FROM inbox 
       WHERE sender_id = $1 AND type = 'friend_request' AND status = 'unread'`,
      [user_id]
    );
    const recipientIds = rows.map((row) => row.recipient_id);
    res.json({ success: true, pendingRequests: recipientIds });
  } catch (err) {
    console.error('Error fetching pending requests:', err);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch pending requests' });
  }
});

router.post('/:recipient_id/:sender_id/update-request', async (req, res) => {
  const { recipient_id, sender_id } = req.params;
  const { request, action, recipient_username } = req.body;
  let newCommitment = null;

  const normalizeJsonField = (value) => {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
      // Handle Postgres array-literal style like {"2025-..."} -> ["2025-..."]
      const trimmed = value.trim();
      const normalized =
        trimmed.startsWith('{') && trimmed.endsWith('}')
          ? `[${trimmed.slice(1, -1)}]`
          : trimmed;
      try {
        return JSON.parse(normalized);
      } catch (e) {
        console.warn('Failed to parse JSON field, defaulting to []', value);
        return [];
      }
    }
    return [];
  };

  try {
    if (action === 'accept') {
      if (request.type === 'friend_request') {
        const [smallerId, largerId] =
          Number(recipient_id) < Number(sender_id)
            ? [recipient_id, sender_id]
            : [sender_id, recipient_id];

        await db.query(
          'INSERT INTO friends (user1_id, user2_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [smallerId, largerId]
        );

        const friendUpdate = {
          type: 'friend_update',
          recipient_id,
          recipient_username,
        };

        sendNotificationToClient(sender_id, friendUpdate);
      }

      if (request.type === 'meeting_request') {
        await db.query(
          'UPDATE meeting_invites SET status = $1 WHERE owner_id = $2 AND member_id = $3',
          [`${action}ed`, sender_id, recipient_id]
        );

        const invite = await db.query(
          'SELECT commitment_id FROM meeting_invites WHERE owner_id = $1 AND member_id = $2 LIMIT 1',
          [sender_id, recipient_id]
        );

        if (invite.rows[0]?.commitment_id) {
          const sourceCommitment = await db.query(
            `SELECT name, starttime, endtime, days, dates 
             FROM commitments 
             WHERE commitment_id = $1`,
            [invite.rows[0].commitment_id]
          );

          if (sourceCommitment.rows[0]) {
            const parsedDays = normalizeJsonField(sourceCommitment.rows[0].days);
            const parsedDates = normalizeJsonField(sourceCommitment.rows[0].dates);
            const jsonDays = JSON.stringify(parsedDays);
            const jsonDates = JSON.stringify(parsedDates);

            const inserted = await db.query(
              `INSERT INTO commitments (user_id, name, starttime, endtime, days, dates)
               VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
               RETURNING commitment_id,
                         user_id,
                         name,
                         starttime AS "startTime",
                         endtime AS "endTime",
                         days,
                         dates`,
              [
                recipient_id,
                sourceCommitment.rows[0].name,
                sourceCommitment.rows[0].starttime,
                sourceCommitment.rows[0].endtime,
                jsonDays,
                jsonDates,
              ]
            );
            newCommitment = inserted.rows[0];
          }
        }
      }
    }

    const { rows } = await db.query(
      'UPDATE inbox SET status = $1 WHERE message_id = $2 RETURNING *',
      [`${action}ed`, request.message_id]
    );

    if (rows[0]) {
      const inboxUpdate = {
        type: 'inbox_update',
        message: rows[0],
      };
      sendNotificationToClient(recipient_id, inboxUpdate);
    }

    res.json({ success: true, commitment: newCommitment });
  } catch (err) {
    console.error('Error updating request:', err);
    res.status(500).json({ success: false, message: 'Failed to update request' });
  }
});

router.post('/:sender_id/:recipient_id/send-message', async (req, res) => {
  const { sender_id, recipient_id } = req.params;
  const { type, content, commitment_id } = req.body;
  const message = {
    recipient_id,
    sender_id,
    status: 'unread',
    type,
    content,
  };

  try {
    const inserted = await db.query(
      `INSERT INTO inbox (recipient_id, sender_id, status, type, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING message_id`,
      [recipient_id, sender_id, 'unread', type, content]
    );

    const message_id = String(inserted.rows[0].message_id);
    const notification = {
      type: 'message',
      message: { ...message, message_id },
    };
    sendNotificationToClient(recipient_id, notification);

    if (type === 'meeting_request' && commitment_id) {
      await db.query(
        `INSERT INTO meeting_invites (owner_id, member_id, commitment_id, status)
         VALUES ($1, $2, $3, 'pending')
         ON CONFLICT (member_id, owner_id, commitment_id) DO UPDATE SET status = 'pending'`,
        [sender_id, recipient_id, commitment_id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error inserting message:', err);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

module.exports = router;

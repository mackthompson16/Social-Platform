const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
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

const addUsernames = async (message) => {
  if (!message) return message;
  try {
    const { rows } = await db.query(
      `SELECT s.username AS sender_username, r.username AS recipient_username
       FROM users s
       JOIN users r ON r.id = $2
       WHERE s.id = $1`,
      [message.sender_id, message.recipient_id]
    );
    if (rows[0]) {
      return { ...message, ...rows[0] };
    }
  } catch (err) {
    console.error('Error fetching usernames for message:', err);
  }
  return message;
};

const safeParseJson = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn('Failed to parse JSON payload', err);
    return null;
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

router.get('/system-agent', async (_req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, username FROM users WHERE username = $1 LIMIT 1`,
      ['cloudflare_agent']
    );
    if (!rows[0]) {
      return res.status(404).json({ success: false, message: 'Agent user not found' });
    }
    return res.json({ success: true, agent: rows[0] });
  } catch (err) {
    console.error('Error retrieving system agent:', err);
    return res.status(500).json({ success: false, message: 'Database query failed' });
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

      res.json(rows.map((row) => ({
        ...row,
        payload: safeParseJson(row.payload),
      })));
  } catch (error) {
    console.error('Error retrieving friends:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id/get-messages', async (req, res) => {
  const userId = req.params.id;
  try {
    const { rows } = await db.query(
      `SELECT inbox.*,
              s.username AS sender_username,
              r.username AS recipient_username
       FROM inbox
       JOIN users s ON inbox.sender_id = s.id
       JOIN users r ON inbox.recipient_id = r.id
       WHERE inbox.recipient_id = $1 OR inbox.sender_id = $1
       ORDER BY inbox.created_at DESC, inbox.message_id DESC`,
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
       WHERE sender_id = $1 AND type = 'friend_request' AND status IN ('unread', 'pending', 'read')`,
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
        const payload = safeParseJson(request.payload);
        if (payload?.editId && payload?.eventId) {
          await db.query(
            `UPDATE event_edit_members
             SET status = $1
             WHERE edit_id = $2 AND user_id = $3`,
            [`${action}ed`, payload.editId, recipient_id]
          );

          if (action === 'accept') {
            const pending = await db.query(
              `SELECT COUNT(*)::int AS remaining
               FROM event_edit_members
               WHERE edit_id = $1 AND status != 'accepted'`,
              [payload.editId]
            );

            if (pending.rows[0]?.remaining === 0) {
              const edit = await db.query(
                `SELECT payload, event_id FROM event_edits WHERE edit_id = $1 LIMIT 1`,
                [payload.editId]
              );
              const editPayload = safeParseJson(edit.rows[0]?.payload);
              const eventId = edit.rows[0]?.event_id;

              if (editPayload && eventId) {
                const members = await db.query(
                  `SELECT user_id, commitment_id FROM event_members WHERE event_id = $1`,
                  [eventId]
                );

                await db.query(
                  `UPDATE event_edits SET status = 'applied' WHERE edit_id = $1`,
                  [payload.editId]
                );

                await Promise.all(
                  members.rows.map(async (member) => {
                    const updated = await db.query(
                      `UPDATE commitments
                       SET name = $1,
                           starttime = $2,
                           endtime = $3,
                           days = $4,
                           dates = $5
                       WHERE commitment_id = $6 AND user_id = $7
                       RETURNING commitment_id,
                                 user_id,
                                 name,
                                 starttime AS "startTime",
                                 endtime AS "endTime",
                                 days,
                                 dates,
                                 event_id AS "eventId"`,
                      [
                        editPayload.name,
                        editPayload.startTime,
                        editPayload.endTime,
                        JSON.stringify(editPayload.days || []),
                        JSON.stringify(editPayload.dates || []),
                        member.commitment_id,
                        member.user_id,
                      ]
                    );

                    if (updated.rows[0]) {
                      sendNotificationToClient(member.user_id, {
                        type: 'commitment_update',
                        commitment: updated.rows[0],
                      });
                    }
                  })
                );
              }
            }
          } else if (action === 'reject') {
            await db.query(
              `UPDATE event_edits SET status = 'rejected' WHERE edit_id = $1`,
              [payload.editId]
            );
          }
        } else if (payload?.name && payload?.startTime && payload?.endTime && payload?.dates) {
          const eventId = payload.eventId || crypto.randomUUID();
          const jsonDays = JSON.stringify(payload.days || []);
          const jsonDates = JSON.stringify(payload.dates);

          const insertCommitment = async (userId) =>
            db.query(
              `INSERT INTO commitments (user_id, name, starttime, endtime, days, dates, event_id)
               VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
               RETURNING commitment_id,
                         user_id,
                         name,
                         starttime AS "startTime",
                         endtime AS "endTime",
                         days,
                         dates,
                         event_id AS "eventId"`,
              [userId, payload.name, payload.startTime, payload.endTime, jsonDays, jsonDates, eventId]
            );

          const [recipientInsert, senderInsert] = await Promise.all([
            insertCommitment(recipient_id),
            insertCommitment(sender_id),
          ]);

          newCommitment = recipientInsert.rows[0];
          if (newCommitment) {
            await db.query(
              `INSERT INTO event_members (event_id, user_id, commitment_id)
               VALUES ($1, $2, $3)
               ON CONFLICT (event_id, user_id) DO UPDATE SET commitment_id = EXCLUDED.commitment_id`,
              [eventId, recipient_id, newCommitment.commitment_id]
            );
            sendNotificationToClient(recipient_id, {
              type: 'commitment_update',
              commitment: newCommitment,
            });
          }

          const senderCommitment = senderInsert.rows[0];
          if (senderCommitment) {
            await db.query(
              `INSERT INTO event_members (event_id, user_id, commitment_id)
               VALUES ($1, $2, $3)
               ON CONFLICT (event_id, user_id) DO UPDATE SET commitment_id = EXCLUDED.commitment_id`,
              [eventId, sender_id, senderCommitment.commitment_id]
            );
            sendNotificationToClient(sender_id, {
              type: 'commitment_update',
              commitment: senderCommitment,
            });
          }
        } else {
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
    }

    if (action === 'reject' && request.type === 'meeting_request') {
      const payload = safeParseJson(request.payload);
      if (payload?.editId) {
        await db.query(
          `UPDATE event_edit_members
           SET status = 'rejected'
           WHERE edit_id = $1 AND user_id = $2`,
          [payload.editId, recipient_id]
        );
        await db.query(
          `UPDATE event_edits SET status = 'rejected' WHERE edit_id = $1`,
          [payload.editId]
        );
      }
    }

    const { rows } = await db.query(
      `UPDATE inbox
       SET status = $1
       WHERE message_id = $2 AND status IN ('unread', 'pending', 'read')
       RETURNING *`,
      [`${action}ed`, request.message_id]
    );

    let hydrated = null;
    if (rows[0]) {
      hydrated = await addUsernames(rows[0]);
      const inboxUpdate = {
        type: 'inbox_update',
        message: hydrated,
      };
      sendNotificationToClient(recipient_id, inboxUpdate);
      sendNotificationToClient(sender_id, inboxUpdate);
    }

    res.json({ success: Boolean(rows[0]), message: hydrated, commitment: newCommitment });
  } catch (err) {
    console.error('Error updating request:', err);
    res.status(500).json({ success: false, message: 'Failed to update request' });
  }
});

router.post('/:sender_id/:recipient_id/send-message', async (req, res) => {
  const { sender_id, recipient_id } = req.params;
  const { type, content, commitment_id, payload } = req.body;

  try {
    const inserted = await db.query(
      `INSERT INTO inbox (recipient_id, sender_id, status, type, content, payload)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING message_id, recipient_id, sender_id, status, type, content, payload, created_at`,
      [recipient_id, sender_id, 'unread', type, content, payload ? JSON.stringify(payload) : null]
    );

    const message = await addUsernames({
      ...inserted.rows[0],
      payload: safeParseJson(inserted.rows[0].payload),
    });
    const notification = {
      type: 'message',
      message: { ...message },
    };
    sendNotificationToClient(recipient_id, notification);
    sendNotificationToClient(sender_id, notification);

    if (type === 'meeting_request' && commitment_id) {
      await db.query(
        `INSERT INTO meeting_invites (owner_id, member_id, commitment_id, status)
         VALUES ($1, $2, $3, 'pending')
         ON CONFLICT (member_id, owner_id, commitment_id) DO UPDATE SET status = 'pending'`,
        [sender_id, recipient_id, commitment_id]
      );
    }

    res.json({ success: true, message });
  } catch (err) {
    console.error('Error inserting message:', err);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

router.post('/:user_id/mark-read', async (req, res) => {
  const { user_id } = req.params;
  const { other_id } = req.body || {};

  try {
    const params = [user_id];
    let whereClause = 'recipient_id = $1 AND status = $2';
    params.push('unread');

    if (other_id) {
      params.push(other_id);
      whereClause += ` AND sender_id = $${params.length}`;
    }

    const { rows } = await db.query(
      `UPDATE inbox
       SET status = 'read'
       WHERE ${whereClause}
       RETURNING *`,
      params
    );

    const hydrated = await Promise.all(rows.map((row) => addUsernames(row)));
    hydrated.forEach((message) => {
      const inboxUpdate = {
        type: 'inbox_update',
        message,
      };
      sendNotificationToClient(user_id, inboxUpdate);
    });

    res.json({ success: true, messages: hydrated });
  } catch (err) {
    console.error('Error marking messages read:', err);
    res.status(500).json({ success: false, message: 'Failed to mark messages read' });
  }
});

router.post('/:requester_id/request-edit', async (req, res) => {
  const { requester_id } = req.params;
  const { eventId, payload } = req.body || {};

  if (!eventId || !payload) {
    return res.status(400).json({ success: false, message: 'eventId and payload are required' });
  }

  try {
    const members = await db.query(
      `SELECT user_id FROM event_members WHERE event_id = $1`,
      [eventId]
    );
    if (!members.rows.length) {
      return res.status(404).json({ success: false, message: 'Event members not found' });
    }

    const editId = crypto.randomUUID();
    await db.query(
      `INSERT INTO event_edits (edit_id, event_id, requester_id, payload)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [editId, eventId, requester_id, JSON.stringify(payload)]
    );

    await Promise.all(
      members.rows.map((member) =>
        db.query(
          `INSERT INTO event_edit_members (edit_id, user_id, status)
           VALUES ($1, $2, $3)
           ON CONFLICT (edit_id, user_id) DO UPDATE SET status = EXCLUDED.status`,
          [editId, member.user_id, member.user_id === Number(requester_id) ? 'accepted' : 'pending']
        )
      )
    );

    const recipients = members.rows.filter((member) => member.user_id !== Number(requester_id));
    const invitePayload = {
      ...payload,
      editId,
      eventId,
    };
    const content = `Edit request: ${payload.name || 'Event update'}`;

    const insertedMessages = await Promise.all(
      recipients.map((member) =>
        db.query(
          `INSERT INTO inbox (recipient_id, sender_id, status, type, content, payload)
           VALUES ($1, $2, 'unread', 'meeting_request', $3, $4::jsonb)
           RETURNING message_id, recipient_id, sender_id, status, type, content, payload, created_at`,
          [member.user_id, requester_id, content, JSON.stringify(invitePayload)]
        )
      )
    );

    await Promise.all(
      insertedMessages.map(async (result, idx) => {
        const row = result.rows[0];
        if (!row) return;
        const hydrated = await addUsernames({
          ...row,
          payload: safeParseJson(row.payload),
        });
        sendNotificationToClient(recipients[idx].user_id, {
          type: 'message',
          message: hydrated,
        });
      })
    );

    res.json({ success: true, editId });
  } catch (err) {
    console.error('Error requesting edit:', err);
    res.status(500).json({ success: false, message: 'Failed to request edit' });
  }
});

module.exports = router;

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

const getEventStatus = async (eventId) => {
  const { rows } = await db.query(
    `SELECT
       CASE WHEN SUM(CASE WHEN status = 'accepted' THEN 0 ELSE 1 END) = 0
            THEN 'accepted' ELSE 'pending' END AS status
     FROM event_members
     WHERE event_id = $1`,
    [eventId]
  );
  return rows[0]?.status || 'accepted';
};

const fetchEventRows = async (eventId) => {
  const { rows } = await db.query(
    `SELECT
       e.event_id AS "eventId",
       e.owner_id AS "ownerId",
       e.name,
       TO_CHAR(e.event_date, 'YYYY-MM-DD') AS "date",
       TO_CHAR(e.start_time, 'HH24:MI') AS "startTime",
       TO_CHAR(e.end_time, 'HH24:MI') AS "endTime",
       e.status AS "eventStatus",
       em.user_id AS "userId",
       em.status AS "memberStatus",
       COALESCE(member_counts.member_count, 1) AS "memberCount"
     FROM events e
     JOIN event_members em ON e.event_id = em.event_id
     LEFT JOIN (
       SELECT event_id, COUNT(*) AS member_count
       FROM event_members
       GROUP BY event_id
     ) member_counts ON e.event_id = member_counts.event_id
     WHERE e.event_id = $1`,
    [eventId]
  );
  return rows;
};

const notifyEventMembers = async (eventId) => {
  if (!eventId) return;
  const rows = await fetchEventRows(eventId);
  rows.forEach((row) => {
    sendNotificationToClient(row.userId, {
      type: 'event_update',
      event: row,
    });
  });
};

const setEventStatus = async (eventId) => {
  const status = await getEventStatus(eventId);
  await db.query(`UPDATE events SET status = $1 WHERE event_id = $2`, [status, eventId]);
  return status;
};

const fetchEventMembers = async (eventId) => {
  const { rows } = await db.query(
    `SELECT em.user_id AS "userId",
            u.username,
            em.status
     FROM event_members em
     JOIN users u ON u.id = em.user_id
     WHERE em.event_id = $1
     ORDER BY u.username`,
    [eventId]
  );
  return rows;
};

const fetchEventById = async (eventId) => {
  const { rows } = await db.query(
    `SELECT event_id AS "eventId",
            name,
            TO_CHAR(event_date, 'YYYY-MM-DD') AS "date",
            TO_CHAR(start_time, 'HH24:MI') AS "startTime",
            TO_CHAR(end_time, 'HH24:MI') AS "endTime"
     FROM events
     WHERE event_id = $1
     LIMIT 1`,
    [eventId]
  );
  return rows[0] || null;
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

router.get('/:id/get-meetings', async (_req, res) => {
  res.json({ success: true, owned_meetings: [], invited_meetings: [] });
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

    res.json(
      rows.map((row) => ({
        ...row,
        payload: safeParseJson(row.payload),
      }))
    );
  } catch (error) {
    console.error('Error retrieving friends:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id/get-messages', async (req, res) => {
  const userId = req.params.id;
  try {
    const { rows } = await db.query(
      `SELECT messages.*,
              s.username AS sender_username,
              r.username AS recipient_username
       FROM messages
       JOIN users s ON messages.sender_id = s.id
       JOIN users r ON messages.recipient_id = r.id
       WHERE messages.recipient_id = $1 OR messages.sender_id = $1
       ORDER BY messages.created_at DESC, messages.message_id DESC`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:user_id/pending-requests', async (req, res) => {
  const { user_id } = req.params;

  try {
    const { rows } = await db.query(
      `SELECT recipient_id FROM messages
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

router.get('/events/:event_id/members', async (req, res) => {
  const { event_id } = req.params;
  try {
    const members = await fetchEventMembers(event_id);
    res.json({ success: true, members });
  } catch (err) {
    console.error('Error fetching event members:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch event members' });
  }
});

router.post('/:user_id/:event_id/update-status', async (req, res) => {
  const { user_id, event_id } = req.params;
  const { status } = req.body || {};
  if (!status || !['accepted', 'declined'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  try {
    await db.query(
      `UPDATE event_members SET status = $1 WHERE event_id = $2 AND user_id = $3`,
      [status, event_id, user_id]
    );
    await setEventStatus(event_id);
    await notifyEventMembers(event_id);
    const members = await fetchEventMembers(event_id);
    res.json({ success: true, members });
  } catch (err) {
    console.error('Error updating event status:', err);
    res.status(500).json({ success: false, message: 'Failed to update event status' });
  }
});

router.post('/:sender_id/:event_id/invite', async (req, res) => {
  const { sender_id, event_id } = req.params;
  const { recipientIds } = req.body || {};
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
    return res.status(400).json({ success: false, message: 'recipientIds required' });
  }
  try {
    const event = await fetchEventById(event_id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await Promise.all(
      recipientIds.map((recipientId) =>
        db.query(
          `INSERT INTO event_members (event_id, user_id, status)
           VALUES ($1, $2, 'pending')
           ON CONFLICT (event_id, user_id)
           DO UPDATE SET status = 'pending'`,
          [event_id, recipientId]
        )
      )
    );

    await setEventStatus(event_id);

    const content = `Event invite: ${event.name}`;
    await Promise.all(
      recipientIds.map((recipientId) =>
        db.query(
          `INSERT INTO messages (recipient_id, sender_id, status, type, content, payload)
           VALUES ($1, $2, 'unread', 'event_invite', $3, $4::jsonb)
           RETURNING message_id, recipient_id, sender_id, status, type, content, payload, created_at`,
          [recipientId, sender_id, content, JSON.stringify({ ...event, eventId: event.eventId })]
        )
      )
    );

    await notifyEventMembers(event_id);

    const members = await fetchEventMembers(event_id);
    res.json({ success: true, members });
  } catch (err) {
    console.error('Error inviting attendees:', err);
    res.status(500).json({ success: false, message: 'Failed to invite attendees' });
  }
});

router.post('/:recipient_id/:sender_id/update-request', async (req, res) => {
  const { recipient_id, sender_id } = req.params;
  const { request, action, recipient_username } = req.body;

  try {
    if (action === 'accept' && request.type === 'friend_request') {
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

    if (request.type === 'event_invite') {
      const payload = safeParseJson(request.payload);
      if (payload?.eventId) {
        await db.query(
          `UPDATE event_members SET status = $1 WHERE event_id = $2 AND user_id = $3`,
          [action === 'accept' ? 'accepted' : 'declined', payload.eventId, recipient_id]
        );
        await setEventStatus(payload.eventId);
        await notifyEventMembers(payload.eventId);
      }
    }

    if (request.type === 'event_edit') {
      const payload = safeParseJson(request.payload);
      if (payload?.eventId) {
        await db.query(
          `UPDATE event_members SET status = $1 WHERE event_id = $2 AND user_id = $3`,
          [action === 'accept' ? 'accepted' : 'declined', payload.eventId, recipient_id]
        );
        await setEventStatus(payload.eventId);
        await notifyEventMembers(payload.eventId);
      }
    }

    const { rows } = await db.query(
      `UPDATE messages
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

    res.json({ success: Boolean(rows[0]), message: hydrated });
  } catch (err) {
    console.error('Error updating request:', err);
    res.status(500).json({ success: false, message: 'Failed to update request' });
  }
});

router.post('/:sender_id/:recipient_id/send-message', async (req, res) => {
  const { sender_id, recipient_id } = req.params;
  const { type, content, payload } = req.body;

  try {
    const inserted = await db.query(
      `INSERT INTO messages (recipient_id, sender_id, status, type, content, payload)
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

    if (type === 'event_invite') {
      const eventPayload = safeParseJson(payload);
      if (eventPayload?.eventId) {
        await db.query(
          `INSERT INTO event_members (event_id, user_id, status)
           VALUES ($1, $2, 'pending')
           ON CONFLICT (event_id, user_id)
           DO UPDATE SET status = 'pending'`,
          [eventPayload.eventId, recipient_id]
        );
        await setEventStatus(eventPayload.eventId);
        await notifyEventMembers(eventPayload.eventId);
      }
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
      `UPDATE messages
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

    await db.query(
      `UPDATE events
       SET name = $1,
           event_date = $2,
           start_time = $3,
           end_time = $4,
           status = 'pending'
       WHERE event_id = $5`,
      [payload.name, payload.date, payload.startTime, payload.endTime, eventId]
    );

    await db.query(
      `UPDATE event_members SET status = 'pending' WHERE event_id = $1`,
      [eventId]
    );
    await db.query(
      `UPDATE event_members SET status = 'accepted' WHERE event_id = $1 AND user_id = $2`,
      [eventId, requester_id]
    );

    const recipients = members.rows.filter((member) => member.user_id !== Number(requester_id));
    const invitePayload = { ...payload, eventId };
    const content = `Edit request: ${payload.name || 'Event update'}`;

    const insertedMessages = await Promise.all(
      recipients.map((member) =>
        db.query(
          `INSERT INTO messages (recipient_id, sender_id, status, type, content, payload)
           VALUES ($1, $2, 'unread', 'event_edit', $3, $4::jsonb)
           RETURNING message_id, recipient_id, sender_id, status, type, content, payload, created_at`,
          [member.user_id, requester_id, content, JSON.stringify(invitePayload)]
        )
      )
    );

    const senderMessageResult = await db.query(
      `INSERT INTO messages (recipient_id, sender_id, status, type, content, payload)
       VALUES ($1, $2, 'read', 'event_edit', $3, $4::jsonb)
       RETURNING message_id, recipient_id, sender_id, status, type, content, payload, created_at`,
      [requester_id, requester_id, content, JSON.stringify(invitePayload)]
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

    if (senderMessageResult.rows[0]) {
      const senderHydrated = await addUsernames({
        ...senderMessageResult.rows[0],
        payload: safeParseJson(senderMessageResult.rows[0].payload),
      });
      sendNotificationToClient(requester_id, {
        type: 'message',
        message: senderHydrated,
      });
    }

    await notifyEventMembers(eventId);

    res.json({ success: true });
  } catch (err) {
    console.error('Error requesting edit:', err);
    res.status(500).json({ success: false, message: 'Failed to request edit' });
  }
});

module.exports = router;

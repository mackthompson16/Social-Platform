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
    console.warn(`Client ${recipientId} not connected for notification`, notification);
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

router.get('/:id/get-events', async (req, res) => {
  const userId = Number(req.params.id);

  try {
    const { rows } = await db.query(
      `SELECT
         e.event_id AS "eventId",
         e.owner_id AS "ownerId",
         e.name,
         TO_CHAR(e.event_date, 'YYYY-MM-DD') AS "date",
         TO_CHAR(e.start_time, 'HH24:MI') AS "startTime",
         TO_CHAR(e.end_time, 'HH24:MI') AS "endTime",
         e.status AS "eventStatus",
         em.status AS "memberStatus",
         COALESCE(member_counts.member_count, 1) AS "memberCount"
       FROM events e
       JOIN event_members em
         ON e.event_id = em.event_id AND em.user_id = $1
       LEFT JOIN (
         SELECT event_id, COUNT(*) AS member_count
         FROM event_members
         GROUP BY event_id
       ) member_counts ON e.event_id = member_counts.event_id
       WHERE em.user_id = $1`,
      [userId]
    );
    res.json({ rows });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/:id/add-event', async (req, res) => {
  const userId = Number(req.params.id);
  const { name, date, startTime, endTime, attendeeIds } = req.body;
  const eventId = crypto.randomUUID();

  try {
    const { rows } = await db.query(
      `INSERT INTO events (event_id, owner_id, name, event_date, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'accepted')
       RETURNING event_id AS "eventId",
                 owner_id AS "ownerId",
                 name,
                 TO_CHAR(event_date, 'YYYY-MM-DD') AS "date",
                 TO_CHAR(start_time, 'HH24:MI') AS "startTime",
                 TO_CHAR(end_time, 'HH24:MI') AS "endTime",
                 status AS "eventStatus"`,
      [eventId, userId, name, date, startTime, endTime]
    );
    const event = rows[0];

    await db.query(
      `INSERT INTO event_members (event_id, user_id, status)
       VALUES ($1, $2, 'accepted')
       ON CONFLICT (event_id, user_id)
       DO UPDATE SET status = 'accepted'`,
      [eventId, userId]
    );

    if (Array.isArray(attendeeIds) && attendeeIds.length) {
      await Promise.all(
        attendeeIds
          .filter((id) => Number(id) !== userId)
          .map((id) =>
            db.query(
              `INSERT INTO event_members (event_id, user_id, status)
               VALUES ($1, $2, 'pending')
               ON CONFLICT (event_id, user_id)
               DO UPDATE SET status = 'pending'`,
              [eventId, id]
            )
          )
      );
    }

    const status = await getEventStatus(eventId);
    await db.query(`UPDATE events SET status = $1 WHERE event_id = $2`, [status, eventId]);

    const memberCount = Array.isArray(attendeeIds)
      ? attendeeIds.filter((id) => Number(id) !== userId).length + 1
      : 1;

    const hydratedEvent = {
      ...event,
      userId: userId,
      eventStatus: status,
      memberStatus: 'accepted',
      memberCount,
    };

    sendNotificationToClient(userId, {
      type: 'event_update',
      event: hydratedEvent,
    });

    res.json({ success: true, event: hydratedEvent, eventId });
  } catch (err) {
    console.error('Error Adding Event:', err);
    res.status(500).json({ success: false, message: 'Error Adding Event' });
  }
});

router.post('/:user_id/:event_id/update-event', async (req, res) => {
  const { user_id, event_id } = req.params;
  const { name, date, startTime, endTime } = req.body;

  try {
    const members = await db.query(
      `SELECT COUNT(*)::int AS member_count FROM event_members WHERE event_id = $1`,
      [event_id]
    );
    if (members.rows[0]?.member_count > 1) {
      return res.status(409).json({
        success: false,
        message: 'requires_request_edit',
        eventId: event_id,
        memberCount: members.rows[0].member_count,
      });
    }

    const { rows } = await db.query(
      `UPDATE events
       SET name = $1,
           event_date = $2,
           start_time = $3,
           end_time = $4
       WHERE event_id = $5 AND owner_id = $6
       RETURNING event_id AS "eventId",
                 owner_id AS "ownerId",
                 name,
                 TO_CHAR(event_date, 'YYYY-MM-DD') AS "date",
                 TO_CHAR(start_time, 'HH24:MI') AS "startTime",
                 TO_CHAR(end_time, 'HH24:MI') AS "endTime",
                 status AS "eventStatus"`,
      [name, date, startTime, endTime, event_id, user_id]
    );

    if (!rows[0]) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const event = rows[0];
    const hydratedEvent = {
      ...event,
      memberStatus: 'accepted',
      memberCount: 1,
    };

    sendNotificationToClient(user_id, {
      type: 'event_update',
      event: hydratedEvent,
    });

    res.json({ success: true, event: hydratedEvent });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ success: false, message: 'Error updating event' });
  }
});

router.delete('/:user_id/:event_id/remove-event', async (req, res) => {
  const { user_id, event_id } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM events WHERE event_id = $1 AND owner_id = $2 RETURNING event_id',
      [event_id, user_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event removed successfully' });
  } catch (error) {
    console.error('Error removing event:', error);
    res.status(500).json({ error: 'Failed to remove event' });
  }
});

router.post('/:id/update-account', async (req, res) => {
  const id = req.params.id;
  const { username, password } = req.body;

  if (!id || !username || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Username and password are required' });
  }

  try {
    const result = await db.query(
      `UPDATE users SET username = $1, password = $2 WHERE id = $3 RETURNING id`,
      [username, password, id]
    );
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating account:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;

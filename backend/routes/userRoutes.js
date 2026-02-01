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

router.get('/:id/get-commitments', async (req, res) => {
  const userId = Number(req.params.id);

  try {
    const { rows } = await db.query(
      `SELECT 
         commitment_id,
         user_id,
         name,
         starttime AS "startTime",
         endtime AS "endTime",
         days,
         dates,
         commitments.event_id AS "eventId",
         COALESCE(member_counts.member_count, 1) AS "memberCount",
         COALESCE(pending_edits.pending_edit, false) AS "pendingEdit"
       FROM commitments
       LEFT JOIN (
         SELECT event_id, COUNT(*) AS member_count
         FROM event_members
         GROUP BY event_id
       ) member_counts ON commitments.event_id = member_counts.event_id
       LEFT JOIN (
         SELECT em.event_id, true AS pending_edit
         FROM event_edit_members eem
         JOIN event_edits ee ON ee.edit_id = eem.edit_id
         JOIN event_members em ON em.event_id = ee.event_id
         WHERE eem.user_id = $1 AND eem.status = 'pending' AND ee.status = 'pending'
         GROUP BY em.event_id
       ) pending_edits ON commitments.event_id = pending_edits.event_id
       WHERE user_id = $1`,
      [userId]
    );
    res.json({ rows });
  } catch (err) {
    console.error('Error fetching commitments:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/:id/add-commitment', async (req, res) => {
  const userId = Number(req.params.id);
  const { name, startTime, endTime, days, dates, eventId } = req.body;
  const finalEventId = eventId || crypto.randomUUID();

  try {
    const { rows } = await db.query(
      `INSERT INTO commitments (user_id, name, starttime, endtime, days, dates, event_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING commitment_id,
                 user_id,
                 name,
                 starttime AS "startTime",
                 endtime AS "endTime",
                 days,
                 dates,
                 event_id AS "eventId"`,
      [userId, name, startTime, endTime, JSON.stringify(days), JSON.stringify(dates), finalEventId]
    );
    const commitment = rows[0];

    await db.query(
      `INSERT INTO event_members (event_id, user_id, commitment_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET commitment_id = EXCLUDED.commitment_id`,
      [finalEventId, userId, commitment.commitment_id]
    );

    console.log('[commitment] inserted', {
      userId,
      id: commitment.commitment_id,
      startTime: commitment.startTime,
      endTime: commitment.endTime,
      dates: commitment.dates,
      eventId: commitment.eventId,
    });

    sendNotificationToClient(userId, {
      type: 'commitment_update',
      commitment,
    });

    res.json({ success: true, id: commitment.commitment_id, commitment, eventId: finalEventId });
  } catch (err) {
    console.error('Error Adding Commitment:', err);
    res.status(500).json({ success: false, message: 'Error Adding Commitment' });
  }
});

router.post('/:user_id/:commitment_id/update-commitment', async (req, res) => {
  const { user_id, commitment_id } = req.params;
  const { name, startTime, endTime, days, dates } = req.body;

  try {
    const eventLookup = await db.query(
      `SELECT event_id FROM commitments WHERE commitment_id = $1 AND user_id = $2`,
      [commitment_id, user_id]
    );
    const eventId = eventLookup.rows[0]?.event_id;
    if (eventId) {
      const countResult = await db.query(
        `SELECT COUNT(*)::int AS member_count FROM event_members WHERE event_id = $1`,
        [eventId]
      );
      if (countResult.rows[0]?.member_count > 1) {
        return res.status(409).json({
          success: false,
          message: 'requires_request_edit',
          eventId,
          memberCount: countResult.rows[0].member_count,
        });
      }
    }

    const { rows } = await db.query(
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
      [name, startTime, endTime, JSON.stringify(days), JSON.stringify(dates), commitment_id, user_id]
    );

    if (!rows[0]) {
      return res.status(404).json({ success: false, message: 'Commitment not found' });
    }

    const commitment = rows[0];
    sendNotificationToClient(user_id, {
      type: 'commitment_update',
      commitment,
    });

    res.json({ success: true, commitment });
  } catch (err) {
    console.error('Error updating commitment:', err);
    res.status(500).json({ success: false, message: 'Error updating commitment' });
  }
});

router.delete('/:user_id/:commitment_id/remove-commitment', async (req, res) => {
  const { user_id, commitment_id } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM commitments WHERE commitment_id = $1 AND user_id = $2 RETURNING commitment_id',
      [commitment_id, user_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Commitment not found' });
    }
    res.json({ message: 'Commitment removed successfully' });
  } catch (error) {
    console.error('Error removing commitment:', error);
    res.status(500).json({ error: 'Failed to remove commitment' });
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

const express = require('express');
const router = express.Router();
const db = require('../db');

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
         dates
       FROM commitments
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
  const { name, startTime, endTime, days, dates } = req.body;

  try {
    const { rows } = await db.query(
      `INSERT INTO commitments (user_id, name, starttime, endtime, days, dates)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING commitment_id`,
      [userId, name, startTime, endTime, JSON.stringify(days), JSON.stringify(dates)]
    );
    res.json({ success: true, id: rows[0].commitment_id });
  } catch (err) {
    console.error('Error Adding Commitment:', err);
    res.status(500).json({ success: false, message: 'Error Adding Commitment' });
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
  const { username, password, email } = req.body;

  if (!id || !username || !password || !email) {
    return res
      .status(400)
      .json({ success: false, message: 'All fields are required' });
  }

  try {
    const result = await db.query(
      `UPDATE users SET username = $1, password = $2, email = $3 WHERE id = $4 RETURNING id`,
      [username, password, email, id]
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

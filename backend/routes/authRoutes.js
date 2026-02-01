const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/create-account', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Username and password are required' });
  }

  try {
    const existing = await db.query(
      'SELECT id, username FROM users WHERE username = $1 LIMIT 1',
      [username]
    );
    if (existing.rows[0]) {
      if (existing.rows[0].username === username) {
        return res.status(409).json({ success: false, message: 'Username already exists' });
      }
    }

    const { rows } = await db.query(
      `INSERT INTO users (username, password)
       VALUES ($1, $2)
       RETURNING id`,
      [username, password]
    );

    res.json({ success: true, id: rows[0].id });
  } catch (err) {
    console.error('Error creating account: ', err);
    if (err.code === '23505') {
      return res
        .status(409)
        .json({ success: false, message: 'Username already exists' });
    }
    return res.status(500).json({ success: false, message: 'Error creating account' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'missing_fields' });
    }
    const { rows } = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ success: false, error: 'username' });
    }
    if (user.password !== password) {
      return res.status(400).json({ success: false, error: 'password' });
    }

    console.log('New Log In: ', user);
    res.json({ success: true, ...user });
  } catch (err) {
    console.error('Error during login: ', err);
    res.status(400).json({ success: false, error: 'login_failed' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/create-account', async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res
      .status(400)
      .json({ success: false, message: 'All fields are required' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO users (username, password, email)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [username, password, email]
    );

    res.json({ success: true, id: rows[0].id });
  } catch (err) {
    console.error('Error creating account: ', err);
    res.status(500).json({ success: false, message: 'Error creating account' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
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

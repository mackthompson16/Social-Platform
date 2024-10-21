const express = require('express');
const cors = require('cors');
const app = express();
const User = require('./user');

app.use(cors());
app.use(express.json());


app.post('/api/create-account', (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  User.createAccount(username, password, email, (result) => {
      res.json(result);
  });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Call the login function and wait for the result
    const result = await User.login(username, password);
    console.log('New Log In: ', result.user);  // Log the user data on the server
    res.json({ success: true, user: result.user });  // Send user data to frontend
  } catch (err) {
    console.error('Error during login: ', err);  // Log any errors on the server
    // Return the error response to the frontend
    res.status(400).json({ success: false, error: err.error || 'An error occurred' });
  }
});

app.post('/api/create-schedule', (req, res) => {
  const { userId, commitments } = req.body; // Expect userId and commitments from the request body

  if (!userId || !commitments || commitments.length === 0) {
      return res.status(400).json({ success: false, message: 'User ID and commitments are required' });
  }

  // Insert the schedule for the user into the database
  db.serialize(() => {
      const scheduleInsertQuery = `INSERT INTO schedules (user_id, commitment, time, days) VALUES (?, ?, ?, ?)`;

      commitments.forEach(commitment => {
          const { commitment: task, startTime, endTime, days } = commitment;
          const time = `${startTime} - ${endTime}`; // Store the time range as a string

          // Insert the schedule for each commitment
          db.run(scheduleInsertQuery, [userId, task, time, days.join(', ')], function (err) {
              if (err) {
                  return res.status(500).json({ success: false, message: 'Database insertion failed' });
              }
          });
      });

      res.json({ success: true, message: 'Schedule added successfully' });
  });
});



app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
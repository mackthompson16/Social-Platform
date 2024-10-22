const express = require('express');
const cors = require('cors');
const app = express();
const db= require('./db');

app.use(cors());
app.use(express.json());

app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json({ users: rows });
  });
});

app.post('/api/users/:userId/schedules', async (req, res) => {
  const userId = req.params.userId;
  const newSchedule = req.body;  // Assuming new schedule is sent in the request body

  try {
      // Step 1: Retrieve the current schedules from the database
      const user = await db.get(`SELECT schedules FROM users WHERE id = ?`, [userId]);

      if (!user) {
          return res.status(404).send('User not found');
      }

      // Step 2: Parse the existing schedules (stored as JSON string)
      let schedules = JSON.parse(user.schedules || '[]');

      // Step 3: Add the new schedule to the array
      schedules.push(newSchedule);

      // Step 4: Update the schedules column in the database
      await db.run(`UPDATE users SET schedules = ? WHERE id = ?`, [JSON.stringify(schedules), userId]);

      res.json({ message: 'Schedule updated successfully', schedules });
  } catch (error) {
      console.error('Failed to update user schedules', error);
      res.status(500).send('Internal server error');
  }
});


app.post('/api/create-account', (req, res) => {
  const { username, password, email } = req.body;

  // Check if all required fields are provided
  if (!username || !password || !email) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Insert new user into the database
  db.run(`INSERT INTO users (username, password, email) VALUES (?, ?, ?)`,
    [username, password, email], function(err) {
        if (err) {
            console.error('Error creating account:', err);
            return res.status(500).json({ success: false, message: 'Error creating account' });
        }

        // Success: Account was created
        console.log('New user ID:', this.lastID);  // `this.lastID` refers to the ID of the newly inserted user
        res.json({ success: true, message: 'Account created successfully', userId: this.lastID });
    }
  );
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Call the login function and wait for the result
    const result = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err || !row) {
          return reject({ success: false, error: 'username' });  // Handle username not found
        } else if (row.password !== password) {
          return reject({ success: false, error: 'password' });  // Handle incorrect password
        } else {
          resolve({ success: true, user: row });  // Successfully log in
        }
      });
    });

    // Log the user data on the server
    console.log('New Log In: ', result.user);
    // Send user data to frontend
    res.json(result);
  } catch (err) {
    console.error('Error during login: ', err);
    // Return the error response to the frontend
    res.status(400).json(err);
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
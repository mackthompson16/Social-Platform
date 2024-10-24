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

app.post('/api/users/:userId/commitments', async (req, res) => {
  const userId = Number(req.params.userId);
  const newCommitment = req.body;


  try {
      await db.run('BEGIN TRANSACTION');  // Start transaction

      // Retrieve the current schedules from the database
      const user = await getUserById(userId);

      // Parse the existing schedules (stored as JSON string)
    
      commitments = JSON.parse(user.commitments);
        
    
      // Add the new schedule to the array
      commitments.push(newCommitment);

      
      // Update the schedules column in the database
      await db.run(`UPDATE users SET commitments = ? WHERE id = ?`, [JSON.stringify(commitments), userId]);

      // Commit transaction
      await db.run('COMMIT');
      console.log("Updated data: ", user)
      res.json({ message: 'Commitment added successfully', user: user });

  } catch (error) {
      console.error('Failed to update user commitments', error);
      await db.run('ROLLBACK');  // Rollback transaction on error
      res.status(500).send('Internal server error');
  }
});


async function getUserById(userId) {
  return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, row) => {
          if (err) {
              reject(err); // Reject the Promise if there's an error
          } else {
              resolve(row); // Resolve with the row if found
          }
      });
  });
}


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

          const newUserId = this.lastID;  // `this.lastID` refers to the ID of the newly inserted user

          // Select the newly created user by ID to return the user data
          db.get(`SELECT * FROM users WHERE id = ?`, [newUserId], (err, row) => {
              if (err) {
                  console.error('Error retrieving new user:', err);
                  return res.status(500).json({ success: false, message: 'Error retrieving new user' });
              }

              // Success: Account created and full user data retrieved
              console.log('New user created:', row);
              res.json({ success: true, message: 'Account created successfully', user: row });
          });
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
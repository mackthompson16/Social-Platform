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
    // Start transaction
    await db.run('BEGIN TRANSACTION');

    // Retrieve the current user from the database using the external getUserById function
    const user = await getUserById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Parse the existing commitments (stored as JSON string)
    let commitments = [];
    if (user.commitments) {
      commitments = JSON.parse(user.commitments); // Safely parse the commitments if they exist
    }

    // Add the new commitment to the array
    commitments.push(newCommitment);

    // Update the commitments column in the database
    await db.run(`UPDATE users SET commitments = ? WHERE id = ?`, [JSON.stringify(commitments), userId]);

    // Commit transaction
    await db.run('COMMIT');

    // Re-fetch the updated user data
    const updatedUser = await getUserById(userId);

    if (!updatedUser) {
      throw new Error('Error retrieving updated user');
    }

    // Log and return the updated user data
    console.log("Updated user data: ", updatedUser);
    res.json({ message: 'Commitment added successfully', user: updatedUser });

  } catch (error) {
    console.error('Failed to update user commitments', error);
    
    // Rollback transaction on error
    await db.run('ROLLBACK');

    res.status(500).json({ message: 'Internal server error' });
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


app.post('/api/create-account', async (req, res) => {
  const { username, password, email } = req.body;

  // Check if all required fields are provided
  if (!username || !password || !email) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    // Wrap the account creation in a Promise
    const result = await new Promise((resolve, reject) => {
      // Insert new user into the database
      db.run(`INSERT INTO users (username, password, email) VALUES (?, ?, ?)`,
        [username, password, email], function (err) {
          if (err) {
            return reject({ success: false, message: 'Error creating account' });
          }

          const newUserId = this.lastID;  // `this.lastID` refers to the ID of the newly inserted user

          // Select the newly created user by ID to return the user data
          db.get(`SELECT * FROM users WHERE id = ?`, [newUserId], (err, row) => {
            if (err || !row) {
              return reject({ success: false, message: 'Error retrieving new user' });
            }
            resolve({ success: true, user: row });  // Resolve with the newly created user
          });
        }
      );
    });

    // Send the response with the new user data
    res.json(result);
  } catch (error) {
    // Handle errors
    res.status(500).json(error);
  }
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
app.post('/api/removeCommitment/:userId/:commitmentId', async (req, res) => {
  const userId = Number(req.params.userId);
  const commitmentId = Number(req.params.commitmentId);

  // Retrieve user by ID
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  
  const commitments = typeof user.commitments === 'string' ? JSON.parse(user.commitments) : user.commitments;

  
  const commitmentExists = commitments.some(commitment => commitment.id === commitmentId);
  if (!commitmentExists) {
    return res.status(404).json({ error: 'Commitment not found' });
  }

  
  const updatedCommitments = commitments.filter(commitment => commitment.id !== commitmentId);
  user.commitments = JSON.stringify(updatedCommitments); // Update with the modified commitments

  // Save the updated user back to the database
  await saveUser(user); // Replace this with your database update logic

  // Send success response
  res.status(200).json({ message: 'Commitment removed successfully', user:getUserById(userId) });
});



app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
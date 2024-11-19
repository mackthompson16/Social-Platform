const express = require('express');
const router = express.Router();
const db= require('../db');



router.post('/create-account', async (req, res) => {
    const { username, password, email } = req.body;
  
    // Check if all required fields are provided
    if (!username || !password || !email) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
  
    try {
      // Wrap the account creation in a Promise
      const result = await new Promise(async (resolve, reject) => {
        // Insert new user into the database
        db.run(`INSERT INTO users (username, password, email) VALUES (?, ?, ?)`,
          [username, password, email], async function (err) {
            if (err) {
              return reject({ success: false, message: 'Error creating account' });
            }
  
            const newUserId = String(this.lastID);  
            
            try {
             
             
              resolve({ success: true, id: newUserId });
            } catch (error) {
              reject({ success: false, message: 'Failed to retrieve user information' });
            }
          }
        );
      });
  
      res.json(result);
    } catch (err) {
      console.error('Error creating account: ', err);
      res.status(500).json(err);
    }
  });
  
  
  router.post('/login', async (req, res) => {
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
            resolve({ success: true, ...row });   
          }
        });
      });
  
      // Log the user data on the server
      console.log('New Log In: ', result);
      // Send user data to frontend
      res.json(result);
    } catch (err) {
      console.error('Error during login: ', err);
      // Return the error response to the frontend
      res.status(400).json(err);
    }
  });

  

module.exports = router;
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
    console.log('server: ', result.user);  // Log the user data on the server
    res.json({ success: true, user: result.user });  // Send user data to frontend
  } catch (err) {
    console.error('Error during login: ', err);  // Log any errors on the server
    // Return the error response to the frontend
    res.status(400).json({ success: false, error: err.error || 'An error occurred' });
  }
});


app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
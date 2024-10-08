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

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  User.login(username, password, (result) => {
      res.json(result);
  });
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
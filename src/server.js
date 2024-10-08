const express = require('express');
const fs = require('fs');
const fastcsv = require('fast-csv');
const cors = require('cors');
const app = express();
app.use(cors());

const csvFilePath = 'knownUsers.csv';

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    
    const knownUsers = [];

    fs.createReadStream(csvFilePath)
        .pipe(fastcsv.parse({ headers: true }))
        .on('data', (row) => {
            knownUsers.push(row);
        })
        .on('end', () => {
          
            const user = knownUsers.find(user => user.username === username);
            
            if (!user) {
               
                return res.json({ success: false, error: 'username' });
            }

            if (user.password !== password) {
                
                return res.json({ success: false, error: 'password' });
            }
            
            return res.json({ success: true });
        })
        .on('error', (err) => {
            console.error(err);
            res.status(500).send('Server error');
        });
});




app.post('/api/create-account', (req, res) => {
    const { username, password, email } = req.body;
  
    if (!username || !password || !email) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
  
    const userData = { username, password, email };
  
    // Check if CSV file exists before writing
    const writableStream = fs.createWriteStream(csvFilePath, { flags: 'a' });
  
    fastcsv
      .write([userData], { headers: false })
      .pipe(writableStream)
      .on('finish', () => {
        res.json({ success: true, message: 'Account created successfully' });
      })
      .on('error', (err) => {
        console.error('Error writing to CSV:', err);
        res.status(500).json({ success: false, message: 'Server error' });
      });
  });

  

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
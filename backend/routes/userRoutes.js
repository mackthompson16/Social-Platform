const express = require('express');
const router = express.Router();
const db= require('../db');



router.get('/:id/get-commitments', async (req, res) => {
  const user_id = Number(req.params.id);

 
    db.all(`SELECT * FROM commitments WHERE user_id = ?`, [user_id], (err, rows) => {
      if (err) {
        console.error('Error fetching commitments:', err);
        res.status(500).json({ message: 'Internal server error' });
      } else {
        console.dir(rows, { depth: null }); // Log the complete structure
        rows.forEach(row => console.log(`Fetched commitment ID: ${row.commitment_id}, Name: ${row.name}, Dates: ${row.dates}`));
        res.json({ rows });
      }
    });
  
});

router.post('/:id/add-commitment', async (req, res) => {
  const id = Number(req.params.id);
  const { name, startTime, endTime, days, dates } = req.body;
  const result = await new Promise(async (resolve, reject) => {
      db.run(
        `INSERT INTO commitments (user_id, name, startTime, endTime, days, dates) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, startTime, endTime, JSON.stringify(days), JSON.stringify(dates)], async function (err) {
          if (err) {
            return reject({ success: false, message: 'Error Adding Commitment' });
          }
    
          try {
           
           
            resolve({ success: true, id: this.lastID});
          } catch (error) {
            reject({ success: false, message: 'Failed to retrieve ID' });
          }
        }
      );
    });
    
    res.json(result);
  });

  


router.delete('/:user_id/:commitment_id/remove-commitment', async (req, res) => {
  const { user_id, commitment_id } = req.params;
  console.log(user_id, 'removed, ', commitment_id);
  try {
      const result = await db.run('DELETE FROM commitments WHERE commitment_id = ? AND user_id = ?', [commitment_id, user_id]);
      if (result.changes === 0) {
          return res.status(404).json({ error: 'Commitment not found' });
      }
      res.json({ message: 'Commitment removed successfully' });
  } catch (error) {
      console.error('Error removing commitment:', error);
      res.status(500).json({ error: 'Failed to remove commitment' });
  }
});

router.post('/:id/update-account', async (req, res) => {
  const id = req.params.id;
  const { username, password, email } = req.body;

  if (!id || !username || !password || !email) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
      db.run(`UPDATE users SET username = ?, password = ?, email = ? WHERE id = ?`, 
      [username, password, email, id], function (err) {
          if (err) {
              return res.status(500).json({ success: false, message: 'Error updating account' });
          }
          if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
          }
          res.json({ success: true });
      });
  } catch (err) {
      console.error('Error updating account:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


module.exports = router;
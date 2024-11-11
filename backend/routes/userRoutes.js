const express = require('express');
const router = express.Router();
const db= require('../db');



router.get('/:id/getCommitments', async (req, res) => {
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

router.post('/:id/addCommitment', async (req, res) => {
  const id = Number(req.params.id);
  const { name, startTime, endTime, days, dates } = req.body;
  
  
    await db.run('BEGIN TRANSACTION');

    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO commitments (user_id, name, startTime, endTime, days, dates) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, startTime, endTime, JSON.stringify(days), JSON.stringify(dates)],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID); // Retrieve the last inserted ID
          }
        }
      );
    });
    
    // Commit the transaction if necessary (though `db.run` operates independently)
    await db.run('COMMIT');
    
    // Now retrieve the newly inserted row
    db.get(
      `SELECT * FROM commitments WHERE user_id = ?`,
      [result],
      (err, row) => {
        if (err) {
          console.error('Error retrieving the newly created commitment:', err);
          res.status(500).json({ message: 'Internal server error' });
        } else {
          // Send the full row as a response
          res.json(row);
        }
      }
    );


});

router.delete('/:user_id/:commitment_id/removeCommitment', async (req, res) => {
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
  const id = req.params;
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
          res.json({ success: true });
      });
  } catch (err) {
      console.error('Error updating account:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


module.exports = router;
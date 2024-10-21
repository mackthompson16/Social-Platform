
const db= require('./db');

class scheduleClass
{
    constructor(commitments)
    {
        this.commitments = commitments
    }

}

class User {
    constructor(username, password, email) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.schedules = [];
    }

    static createAccount(username, password, email, callback) {
        db.run(`INSERT INTO users (username, password, email) VALUES (?, ?, ?)`,
            [username, password, email], function(err) {
                if (err) {
                    callback({ success: false, message: 'Error creating account' });
                } else {
                    console.log('user: ', row)
                    callback({ success: true, message: 'Account created successfully' });
                }
            });
    }

    static login(username, password) {
        return new Promise((resolve, reject) => {
          db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
            if (err || !row) {
              reject({ success: false, error: 'username' });
            } else if (row.password !== password) {
              reject({ success: false, error: 'password' });
            } else {
              // Return the user data
              resolve({ success: true, user: row });
            }
          });
        });
      }
          
      
    static getAllUsers(callback) {
        db.all('SELECT * FROM users', [], (err, rows) => {
            if (err) {
                return callback(err);
            }
            return callback(null, rows);
        });
    }

    createSchedule(commitments) {
      console.log(commitments); // Log to ensure commitments are passed correctly

      const new_schedule = new scheduleClass(commitments);

      // Ensure that this.schedules is an array
      if (!this.schedules) {
          this.schedules = [];
      }

      // Push the new schedule to this user's schedule array
      this.schedules.push(new_schedule);
  }


}

module.exports = User;

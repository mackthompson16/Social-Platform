
const db= require('./db');

class User {
    constructor(username, password, email) {
        this.username = username;
        this.password = password;
        this.email = email;
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


}

module.exports = User;

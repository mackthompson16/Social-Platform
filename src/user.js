
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
                    callback({ success: true, message: 'Account created successfully' });
                }
            });
    }

    static login(username, password, callback) {
        db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
            if (err || !row) {
                return callback({ success: false, error: 'username' });
            }
            if (row.password !== password) {
                return callback({ success: false, error: 'password' });
            }
            callback({ success: true });
        });
    }
}

module.exports = User;

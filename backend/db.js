const sqlite3 = require('sqlite3').verbose();
const dbPath = './users.db';

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log(`Connected to the SQLite database at ${dbPath}.`);

        // Create the users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE
             )`, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } 
        });


        // Create the commitments table with a foreign key linking to the users table
        db.run(`CREATE TABLE IF NOT EXISTS commitments (
            commitment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            startTime TEXT NOT NULL,
            endTime TEXT NOT NULL,
            days TEXT NOT NULL,
            dates TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`, (err) => {
           
            if (err) {
                console.error('Error creating commitments table:', err.message);
            } 
        });

        db.run(`CREATE TABLE IF NOT EXISTS inbox (
                message_id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipient_id INTEGER,
                sender_id INTEGER,
                status DEFAULT unread,
                type TEXT CHECK(type IN ('friend_request', 'message', 'meeting_request')),
                content TEXT,
                FOREIGN KEY (recipient_id) REFERENCES users(id),
                FOREIGN KEY (sender_id) REFERENCES users(id)
            )`, (err) => {
           
                if (err) {
                    console.error('Error creating inbox table:', err.message);
                } 
            });
        
        db.run(`CREATE TABLE IF NOT EXISTS friends (
                user_id INTEGER,
                friend_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (friend_id) REFERENCES users(id),
                PRIMARY KEY (user_id, friend_id)
            )`, (err) => {
           
            if (err) {
                console.error('Error creating friends table:', err.message);
            } 
        });


    }
});

module.exports = db;
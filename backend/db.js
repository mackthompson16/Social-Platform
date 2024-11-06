const sqlite3 = require('sqlite3').verbose();
const dbPath = './users.db';

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log(`Connected to the SQLite database at ${dbPath}.`);

        // Create the users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            user_Id INTEGER PRIMARY KEY AUTOINCREMENT,
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
            commitment_Id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_Id INTEGER NOT NULL,
            name TEXT NOT NULL,
            startTime TEXT NOT NULL,
            endTime TEXT NOT NULL,
            days TEXT NOT NULL,
            dates TEXT NOT NULL,
            FOREIGN KEY (user_Id) REFERENCES users(user_Id) ON DELETE CASCADE
        )`, (err) => {
           
            if (err) {
                console.error('Error creating commitments table:', err.message);
            } 
        });

        db.run(`CREATE TABLE IF NOT EXISTS inbox (
                message_Id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipient_Id INTEGER,
                sender_Id INTEGER,
                read INTEGER DEFAULT 0,
                type TEXT CHECK(type IN ('friend_request', 'message', 'meeting_request')),
                content TEXT,
                FOREIGN KEY (recipient_id) REFERENCES users(user_Id),
                FOREIGN KEY (sender_Id) REFERENCES users(user_Id)
            )`, (err) => {
           
                if (err) {
                    console.error('Error creating inbox table:', err.message);
                } 
            });
        
        db.run(`CREATE TABLE IF NOT EXISTS friends (
                user_Id INTEGER,
                friend_Id INTEGER,
                FOREIGN KEY (user_Id) REFERENCES users(user_Id),
                FOREIGN KEY (friend_Id) REFERENCES users(user_Id),
                PRIMARY KEY (user_Id, friend_Id)
            )`, (err) => {
           
            if (err) {
                console.error('Error creating friends table:', err.message);
            } 
        });


    }
});

module.exports = db;

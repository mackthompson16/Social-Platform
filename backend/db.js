const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const ssl =
  process.env.PGSSL === 'true'
    ? { rejectUnauthorized: false }
    : false;

if (!connectionString) {
  console.warn(
    'DATABASE_URL is not set. Set it to a PostgreSQL connection string (e.g. postgres://user:pass@host:5432/dbname).'
  );
}

const pool = new Pool({
  connectionString,
  ssl,
});

async function init() {
  const ddl = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS commitments (
      commitment_id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      days JSONB NOT NULL,
      dates JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meeting_invites (
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      member_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      commitment_id INTEGER NOT NULL REFERENCES commitments(commitment_id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      PRIMARY KEY (member_id, owner_id, commitment_id)
    );

    CREATE TABLE IF NOT EXISTS inbox (
      message_id SERIAL PRIMARY KEY,
      recipient_id INTEGER REFERENCES users(id),
      sender_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'unread',
      type TEXT CHECK(type IN ('friend_request', 'message', 'meeting_request')),
      content TEXT
    );

    CREATE TABLE IF NOT EXISTS friends (
      user1_id INTEGER REFERENCES users(id),
      user2_id INTEGER REFERENCES users(id),
      PRIMARY KEY (user1_id, user2_id)
    );
  `;

  try {
    await pool.query(ddl);
    console.log('PostgreSQL tables ensured.');
  } catch (err) {
    console.error('Error ensuring database schema:', err);
  }
}

init();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};

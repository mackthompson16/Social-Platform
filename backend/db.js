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
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      event_id UUID PRIMARY KEY,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      event_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      status TEXT NOT NULL DEFAULT 'accepted'
    );

    CREATE TABLE IF NOT EXISTS event_members (
      event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      PRIMARY KEY (event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS friends (
      user1_id INTEGER REFERENCES users(id),
      user2_id INTEGER REFERENCES users(id),
      PRIMARY KEY (user1_id, user2_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      message_id SERIAL PRIMARY KEY,
      recipient_id INTEGER REFERENCES users(id),
      sender_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'unread',
      type TEXT CHECK(type IN ('friend_request', 'message', 'event_invite', 'event_edit')),
      content TEXT,
      payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_event_members_user ON event_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_recipient_created ON messages(recipient_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON messages(sender_id, created_at DESC);
  `;

  try {
    await pool.query(ddl);
    await pool.query(
      `INSERT INTO users (username, password)
       VALUES ($1, $2)
       ON CONFLICT (username) DO NOTHING`,
      ['cloudflare_agent', 'system']
    );
    await pool.query(
      `INSERT INTO users (username, password)
       VALUES ($1, $2)
       ON CONFLICT (username) DO NOTHING`,
      ['demo', 'demo']
    );
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

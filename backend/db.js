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

    CREATE TABLE IF NOT EXISTS commitments (
      commitment_id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      days JSONB NOT NULL,
      dates JSONB NOT NULL,
      event_id UUID
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
      content TEXT,
      payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS friends (
      user1_id INTEGER REFERENCES users(id),
      user2_id INTEGER REFERENCES users(id),
      PRIMARY KEY (user1_id, user2_id)
    );

    CREATE TABLE IF NOT EXISTS event_members (
      event_id UUID NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      commitment_id INTEGER NOT NULL REFERENCES commitments(commitment_id) ON DELETE CASCADE,
      PRIMARY KEY (event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS event_edits (
      edit_id UUID PRIMARY KEY,
      event_id UUID NOT NULL,
      requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      payload JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS event_edit_members (
      edit_id UUID NOT NULL REFERENCES event_edits(edit_id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      PRIMARY KEY (edit_id, user_id)
    );

    ALTER TABLE inbox
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    ALTER TABLE inbox
      ADD COLUMN IF NOT EXISTS payload JSONB;

    ALTER TABLE users
      DROP COLUMN IF EXISTS email;

    ALTER TABLE commitments
      ADD COLUMN IF NOT EXISTS event_id UUID;
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

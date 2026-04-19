const { Pool } = require('pg');

let pool;

async function initDB() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  await pool.query('SELECT NOW()');
  console.log('✅ PostgreSQL connected');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      streak INTEGER DEFAULT 0,
      last_active TEXT,
      created_at TEXT DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
    );

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      content TEXT,
      size INTEGER,
      uploaded_at TEXT DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      material_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      topic TEXT,
      difficulty TEXT DEFAULT 'medium',
      estimated_minutes INTEGER DEFAULT 30,
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      created_at TEXT DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      questions TEXT NOT NULL,
      score INTEGER,
      taken_at TEXT,
      created_at TEXT DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT,
      date TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 0,
      goal TEXT,
      completed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      material_id TEXT,
      created_at TEXT DEFAULT (to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT,
      scheduled_date TEXT NOT NULL,
      time_slot TEXT,
      duration_minutes INTEGER DEFAULT 30,
      completed INTEGER DEFAULT 0
    );
  `);

  console.log('✅ Database tables ready');
  return pool;
}

function getDB() {
  if (!pool) throw new Error('Database not initialized');

  return {
    get: async (sql, params = []) => {
      const result = await pool.query(convertSQL(sql), params);
      return result.rows[0] || null;
    },
    all: async (sql, params = []) => {
      const result = await pool.query(convertSQL(sql), params);
      return result.rows;
    },
    run: async (sql, params = []) => {
      const result = await pool.query(convertSQL(sql), params);
      return { changes: result.rowCount };
    },
    exec: async (sql) => {
      await pool.query(sql);
    }
  };
}

function convertSQL(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

module.exports = { initDB, getDB };

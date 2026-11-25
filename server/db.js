const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    score INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
`);

const createUserStmt = db.prepare(
  'INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)'
);
const findUserByUsernameStmt = db.prepare(
  'SELECT id, username, password_hash, created_at FROM users WHERE username = ?'
);
const findUserByIdStmt = db.prepare(
  'SELECT id, username, created_at FROM users WHERE id = ?'
);
const createScoreStmt = db.prepare(
  'INSERT INTO scores (user_id, score, created_at) VALUES (?, ?, ?)'
);
const leaderboardStmt = db.prepare(`
  SELECT u.username AS username, s.score AS score, s.created_at AS created_at
  FROM scores s
  JOIN users u ON u.id = s.user_id
  ORDER BY s.score DESC, s.created_at ASC
  LIMIT 20
`);

function createUser(username, passwordHash) {
  const createdAt = new Date().toISOString();
  const info = createUserStmt.run(username, passwordHash, createdAt);
  return { id: info.lastInsertRowid, username, created_at: createdAt };
}

function findUserByUsername(username) {
  return findUserByUsernameStmt.get(username);
}

function findUserById(id) {
  return findUserByIdStmt.get(id);
}

function createScore(userId, score) {
  const createdAt = new Date().toISOString();
  const info = createScoreStmt.run(userId, score, createdAt);
  return { id: info.lastInsertRowid, user_id: userId, score, created_at: createdAt };
}

function getLeaderboard() {
  return leaderboardStmt.all();
}

module.exports = {
  db,
  createUser,
  findUserByUsername,
  findUserById,
  createScore,
  getLeaderboard,
};

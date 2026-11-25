const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, findUserByUsername } = require('../db');

const router = express.Router();

const USERNAME_RE = /^[A-Za-z0-9_]+$/;

router.post('/register', (req, res) => {
  const { username, password } = req.body || {};

  if (typeof username !== 'string' || username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be 3-20 characters long' });
  }
  if (!USERNAME_RE.test(username)) {
    return res
      .status(400)
      .json({ error: 'Username may only contain letters, digits and underscores' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const user = createUser(username, passwordHash);
    return res.status(201).json({ id: user.id, username: user.username });
  } catch (err) {
    if (err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Username already taken' });
    }
    // Fallback for constraint errors reported differently
    if (err && /UNIQUE constraint failed/i.test(err.message || '')) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    throw err;
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const user = findUserByUsername(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  return res.status(200).json({ token, username: user.username });
});

module.exports = router;

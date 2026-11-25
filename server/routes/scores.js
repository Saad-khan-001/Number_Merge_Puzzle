const express = require('express');
const auth = require('../middleware/auth');
const { createScore, getLeaderboard, findUserByUsername } = require('../db');

const router = express.Router();

router.post('/', auth, (req, res) => {
  const { score } = req.body || {};

  if (typeof score !== 'number' || !Number.isInteger(score)) {
    return res.status(400).json({ error: 'Score must be an integer' });
  }
  if (score < 1 || score > 10000000) {
    return res.status(400).json({ error: 'Score must be between 1 and 10000000' });
  }

  const saved = createScore(req.user.id, score);
  return res.status(201).json({
    id: saved.id,
    score: saved.score,
    username: req.user.username,
    created_at: saved.created_at,
  });
});

router.get('/leaderboard', (req, res) => {
  const rows = getLeaderboard();
  return res.status(200).json(rows);
});

module.exports = router;

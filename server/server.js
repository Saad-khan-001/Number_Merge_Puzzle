const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRouter = require('./routes/auth');
const scoresRouter = require('./routes/scores');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  })
);
app.use(express.json({ limit: '10kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const scorePostLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

app.use('/api/auth', authLimiter, authRouter);
// Rate-limit only POST /api/scores (not the public leaderboard GET)
app.use('/api/scores', (req, res, next) => {
  if (req.method === 'POST') return scorePostLimiter(req, res, next);
  return next();
}, scoresRouter);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'number-merge-puzzle' });
});

// Alias so the leaderboard is also reachable at /api/leaderboard
// (canonical path is /api/scores/leaderboard, served by scoresRouter)
app.get('/api/leaderboard', (req, res) => {
  const { getLeaderboard } = require('./db');
  res.status(200).json(getLeaderboard());
});

// Final error-handling middleware — never leaks stack traces or internals
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;

if (require.main === module) {
  if (!process.env.JWT_SECRET) {
    console.error('Error: JWT_SECRET environment variable is not set');
    process.exit(1);
  }
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`number-merge-puzzle server listening on port ${PORT}`);
  });
}

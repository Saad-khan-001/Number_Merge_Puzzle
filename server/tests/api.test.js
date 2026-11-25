process.env.JWT_SECRET = 'test-secret-for-tests-only';
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
process.env.DB_PATH = path.join(os.tmpdir(), `test-${Date.now()}.db`);

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const app = require('../server.js');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  try {
    fs.unlinkSync(process.env.DB_PATH);
  } catch (err) {
    // temp db may already be gone
  }
});

async function postJson(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

test('GET /api/health returns 200 and {status: ok}', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'number-merge-puzzle');
});

test('POST /api/auth/register 201 with a valid user', async () => {
  const { res, data } = await postJson(`${baseUrl}/api/auth/register`, {
    username: 'testplayer',
    password: 'password123',
  });
  assert.equal(res.status, 201);
  assert.equal(data.username, 'testplayer');
  assert.ok(typeof data.id === 'number');
});

test('POST /api/auth/register 409 on duplicate username', async () => {
  const { res, data } = await postJson(`${baseUrl}/api/auth/register`, {
    username: 'testplayer',
    password: 'password123',
  });
  assert.equal(res.status, 409);
  assert.equal(data.error, 'Username already taken');
});

test('POST /api/auth/register 400 on short password', async () => {
  const { res } = await postJson(`${baseUrl}/api/auth/register`, {
    username: 'shortpw',
    password: 'short',
  });
  assert.equal(res.status, 400);
});

test('POST /api/auth/register 400 on bad username', async () => {
  const { res } = await postJson(`${baseUrl}/api/auth/register`, {
    username: 'bad name!',
    password: 'password123',
  });
  assert.equal(res.status, 400);
  const { res: res2 } = await postJson(`${baseUrl}/api/auth/register`, {
    username: 'ab',
    password: 'password123',
  });
  assert.equal(res2.status, 400);
});

test('POST /api/auth/login 200 returns a token', async () => {
  const { res, data } = await postJson(`${baseUrl}/api/auth/login`, {
    username: 'testplayer',
    password: 'password123',
  });
  assert.equal(res.status, 200);
  assert.ok(typeof data.token === 'string' && data.token.length > 0);
  assert.equal(data.username, 'testplayer');
  globalThis.__token = data.token;
});

test('POST /api/auth/login 401 on wrong password', async () => {
  const { res, data } = await postJson(`${baseUrl}/api/auth/login`, {
    username: 'testplayer',
    password: 'wrongpassword',
  });
  assert.equal(res.status, 401);
  assert.equal(data.error, 'Invalid username or password');
});

test('POST /api/scores without token -> 401', async () => {
  const { res } = await postJson(`${baseUrl}/api/scores`, { score: 100 });
  assert.equal(res.status, 401);
});

test('POST /api/scores with token but invalid scores -> 400', async () => {
  const token = globalThis.__token;
  assert.ok(token, 'login token must exist');
  for (const bad of [-5, 1.5, '100', 99999999, 0]) {
    const { res } = await postJson(`${baseUrl}/api/scores`, { score: bad }, token);
    assert.equal(res.status, 400, `score ${JSON.stringify(bad)} should be 400`);
  }
  const { res: resMissing } = await postJson(`${baseUrl}/api/scores`, {}, token);
  assert.equal(resMissing.status, 400);
});

test('POST /api/scores with token and score 1200 -> 201', async () => {
  const token = globalThis.__token;
  const { res, data } = await postJson(`${baseUrl}/api/scores`, { score: 1200 }, token);
  assert.equal(res.status, 201);
  assert.equal(data.score, 1200);
  assert.equal(data.username, 'testplayer');
  assert.ok(typeof data.id === 'number');
  assert.ok(typeof data.created_at === 'string');
});

test('GET /api/scores/leaderboard returns array containing the posted score', async () => {
  const res = await fetch(`${baseUrl}/api/scores/leaderboard`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data));
  const entry = data.find((row) => row.username === 'testplayer' && row.score === 1200);
  assert.ok(entry, 'leaderboard should contain testplayer with score 1200');
});

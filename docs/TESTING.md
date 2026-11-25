# Testing

This document explains what is tested, how to run the tests, and how to add a new test.

Tests use the Node.js built-in test runner (`node:test`). No extra test framework is needed. The test files use `node:test` and `node:assert/strict`.

## Test Suites

| Suite | File | What it tests |
|---|---|---|
| Game logic | `client/tests/game-logic.test.js` | The pure game rules in `client/js/game-logic.js`. |
| API | `server/tests/api.test.js` | The server endpoints in `server/server.js`, `server/routes/auth.js`, and `server/routes/scores.js`. |

## What Is Tested

### Game Logic Tests (`client/tests/game-logic.test.js`)

The game-logic tests call the pure functions directly. No browser and no page are needed.

**createBoard**
- A new board is 4x4 (4 rows, 4 columns).
- A new board is empty (all squares are 0 or null, depending on the implementation).

**move**
- Moving left slides tiles to the left.
- Moving right slides tiles to the right.
- Moving up slides tiles to the top.
- Moving down slides tiles to the bottom.
- Two equal tiles merge into one tile with double the value (2 + 2 = 4).
- A tile merges only once per move. For example, `[2, 2, 2, 2]` moved left becomes `[4, 4, 0, 0]`, not `[8, 0, 0, 0]`.
- Different tiles do not merge (2 and 4 stay separate).
- A merge adds the new tile's value to the points scored.
- A move that changes nothing reports "no movement" (so no new tile spawns and the move counter does not increase).
- A move that changes the board reports "moved".

**spawnTile**
- A new tile is added to an empty square only.
- A new tile is 2 or 4.
- The number of filled squares increases by exactly one.
- Spawning on a full board changes nothing (or reports that no tile could spawn).

**canMove**
- Returns true when the board has an empty square.
- Returns true when two equal tiles sit next to each other, even on a full board.
- Returns false when the board is full and no equal neighbours exist.

**hasWon**
- Returns true when any tile is 2048.
- Returns false when the highest tile is below 2048.

**isGameOver**
- Returns true when the board is full and no move is possible.
- Returns false when the board has an empty square.
- Returns false when a merge is still possible on a full board.

### API Tests (`server/tests/api.test.js`)

The API tests start the server (or the Express app) with a test database, then send real HTTP requests to it.

**GET /api/health**
- Returns `200` with `{status:'ok', service:'number-merge-puzzle'}`.

**POST /api/auth/register**
- A valid username and password returns `201` with `{id, username}`.
- A missing username or password returns `400`.
- An empty username or password returns `400`.
- Registering the same username twice returns `409` on the second try.
- The stored password is a bcrypt hash, not the plain password.

**POST /api/auth/login**
- A correct username and password returns `200` with `{token, username}`.
- A wrong password returns `401`.
- A username that does not exist returns `401`.
- A missing username or password returns `400`.

**POST /api/scores**
- A valid score with a valid JWT returns `201`.
- A request with no token returns `401`.
- A request with an invalid token returns `401`.
- A score of 0 returns `400`.
- A negative score returns `400`.
- A non-integer score (for example 12.5 or `"100"`) returns `400`.
- A score above 10000000 returns `400`.
- A missing score returns `400`.

**GET /api/leaderboard**
- Returns `200` with an array.
- The array holds at most 20 entries.
- Entries are ordered by score, highest first.
- Each entry has `username`, `score`, and `created_at`.
- The endpoint works without a login (public).

## How to Run Tests

### Run all tests (from the project root)

```bash
npm test
```

This runs both suites: `client/tests/game-logic.test.js` and `server/tests/api.test.js`.

### Run one suite alone

Run the game-logic tests only:

```bash
node --test client/tests/game-logic.test.js
```

Run the API tests only:

```bash
node --test server/tests/api.test.js
```

### Before you run the API tests

Install the server dependencies first, if you have not done so yet:

```bash
cd server && npm install
```

The API tests use their own test database. They do not touch the real `server/data.db`.

## What "All Tests Pass" Means

When you run `npm test`, the output ends with a summary. "All tests pass" means:

- Every test case listed above ran.
- Every test case passed (no failures, no errors).
- The exit code is `0`. (A non-zero exit code means at least one test failed.)

If any test fails, read the failure message. It names the test and shows what was expected and what actually happened. Fix the code or the test, then run `npm test` again.

## How to Add a New Test

1. Open the right test file: `client/tests/game-logic.test.js` for game rules, `server/tests/api.test.js` for the API.
2. Add a new `test()` block. Use a clear name that says what is being checked. Example:

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('moving left merges 2 + 2 into 4', () => {
  const board = [
    [2, 2, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  const result = move(board, 'left');
  assert.deepEqual(result.board[0], [4, 0, 0, 0]);
});
```

3. Keep game-logic tests pure: pass a board in, check the board that comes out. Do not touch the DOM in these tests.
4. Keep API tests realistic: send a real HTTP request and check the status code and the response body.
5. Run `npm test` to check that the new test passes and that no old test broke.

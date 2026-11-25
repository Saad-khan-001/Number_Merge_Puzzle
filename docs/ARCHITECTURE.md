# Architecture

This document explains how the Number Merge Puzzle project fits together.

## Overview

The project has two parts:

1. **Client** — the game itself. It runs in the web browser. It is plain HTML, CSS, and JavaScript. It needs no build step.
2. **Server** — an optional backend. It runs on Node.js with Express and SQLite (better-sqlite3). It stores user accounts and scores. It also powers the leaderboard.

The client works fully on its own. You can play the whole game without the server. The server only adds accounts, saved scores, and the leaderboard.

```
Browser (client)                Server (Node.js + Express + SQLite)
┌─────────────────────┐         ┌──────────────────────────────────┐
│ index.html          │         │ server.js                        │
│ styles.css          │  HTTP   │  routes/auth.js   routes/scores.js│
│ js/app.js           │◄──────► │  middleware/auth.js              │
│ js/game-logic.js    │  /api/* │  db.js ──► data.db (SQLite)      │
│ (localStorage:      │         │    tables: users, scores         │
│  best score)        │         │                                  │
└─────────────────────┘         └──────────────────────────────────┘
```

## Client

### Files

| File | What it does |
|---|---|
| `client/index.html` | The page structure: the 4x4 grid, the score display, the move counter, the New Game and Undo buttons, and the on-screen arrow buttons. |
| `client/styles.css` | All styling: the board, the tiles, the colors, and the layout. |
| `client/js/game-logic.js` | The pure game rules. No DOM code lives here. See below. |
| `client/js/app.js` | The part that talks to the page. It draws the board, listens for swipes, arrow keys, and button taps, and saves the best score. |
| `client/tests/game-logic.test.js` | Tests for the game rules. |

### Game-Logic Design: Pure Functions

`client/js/game-logic.js` holds only pure functions. A pure function is a function that:

- takes input and returns output,
- does not read or change the page (no DOM),
- does not read or change anything outside itself (no localStorage, no network, no random hidden state, except where the function itself is asked to spawn a tile),
- gives the same output for the same input, every time.

The pure functions are:

| Function | What it does |
|---|---|
| `createBoard()` | Creates a new empty 4x4 board. |
| `move(board, direction)` | Slides the tiles in one direction, merges equal tiles, and returns the new board, the points scored, and whether anything moved. |
| `spawnTile(board)` | Adds a new tile (2 or 4) to a random empty square. Returns the new board. |
| `canMove(board)` | Returns true if any move is still possible (an empty square exists, or two equal tiles sit next to each other). |
| `hasWon(board)` | Returns true if any tile is 2048 or higher. |
| `isGameOver(board)` | Returns true when the board is full and `canMove` is false. |

Why keep the DOM out of `game-logic.js`?

- **It is easy to test.** The tests in `client/tests/game-logic.test.js` can call `move()` or `isGameOver()` directly, with no browser and no page. The test just passes in a board and checks the result.
- **It is easy to reuse.** The same logic can be used in the web client, in a mobile app, or in any other front end, without change.
- **It is easy to read.** The rules live in one place. The display code lives in another place. A bug in the display cannot break the rules, and a bug in the rules is easy to find.

`client/js/app.js` is the only file that touches the DOM. It:

- calls the pure functions from `game-logic.js`,
- draws the board on the page,
- listens for swipes, arrow keys, and on-screen buttons,
- updates the score, the best score, and the move counter,
- saves the best score in `localStorage`,
- handles New Game and the one-step Undo (it keeps a copy of the board from before the last move).

## Server

### Files

| File | What it does |
|---|---|
| `server/server.js` | Starts the Express app. Sets up helmet, rate limiting, CORS, JSON parsing, and the routes. Listens on `PORT` (default 3000). |
| `server/db.js` | Opens the SQLite database (`DB_PATH`, default `data.db`) and creates the `users` and `scores` tables if they do not exist yet. |
| `server/routes/auth.js` | `POST /api/auth/register` and `POST /api/auth/login`. |
| `server/routes/scores.js` | `POST /api/scores` and `GET /api/leaderboard`. |
| `server/middleware/auth.js` | Checks the JWT Bearer token on protected routes. |
| `server/tests/api.test.js` | Tests for the API endpoints. |

### Environment Variables

| Variable | Default | What it does |
|---|---|---|
| `JWT_SECRET` | (none — you must set it) | Secret used to sign and check JWT login tokens. |
| `PORT` | `3000` | The port the server listens on. |
| `CORS_ORIGIN` | `http://localhost:8080` | The only web address allowed to call the API from a browser. |
| `DB_PATH` | `data.db` | The path of the SQLite database file. |

Copy `server/.env.example` to `server/.env` and set `JWT_SECRET` there. Never commit `server/.env` to Git.

### Database Tables

The database file is `server/data.db` (SQLite). It has two tables.

**users**

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | Primary key. Auto-increment. |
| `username` | TEXT | UNIQUE. No two users can have the same username. |
| `password_hash` | TEXT | bcrypt hash of the password. The plain password is never stored. |
| `created_at` | TEXT | Date and time the account was created. |

**scores**

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | Primary key. Auto-increment. |
| `user_id` | INTEGER | The user who got the score. Refers to `users(id)`. |
| `score` | INTEGER | The score value. Must be an integer from 1 to 10000000. |
| `created_at` | TEXT | Date and time the score was saved. |

All SQL queries use parameters only. No user input is ever pasted into an SQL string. See `docs/SECURITY.md`.

## Data Flow for a Move

A move happens fully in the browser. The server is not involved.

1. The player swipes, presses an arrow key, or taps an on-screen arrow button.
2. `app.js` receives the direction (up, down, left, or right).
3. `app.js` saves a copy of the current board, so Undo can restore it later.
4. `app.js` calls `move(board, direction)` from `game-logic.js`.
5. `move()` slides the tiles, merges equal tiles, and returns the new board and the points scored.
6. If nothing moved, the move is ignored. The move counter does not increase.
7. If something moved, `app.js` calls `spawnTile(board)` to add a new 2 or 4 tile.
8. `app.js` updates the score and the move counter, and redraws the board.
9. `app.js` calls `hasWon(board)`. If true, it shows the win message.
10. `app.js` calls `isGameOver(board)`. If true, it shows the game-over message.
11. If the score is higher than the best score, `app.js` saves the new best score in `localStorage`.

## Data Flow for Saving a Score

Saving a score needs the server. The player must be logged in.

1. The player registers with `POST /api/auth/register` (`{username, password}`). The server hashes the password with bcrypt and stores the user. It returns `201 {id, username}`.
2. The player logs in with `POST /api/auth/login` (`{username, password}`). The server checks the password against the stored bcrypt hash. If it matches, the server signs a JWT with `JWT_SECRET` and returns `200 {token, username}`.
3. The client stores the token (for example in memory or localStorage) and sends it on later requests in the `Authorization: Bearer <token>` header.
4. When the player finishes a game, the client sends `POST /api/scores` with the header `Authorization: Bearer <token>` and the body `{score}`.
5. `middleware/auth.js` checks the token. If there is no token, or the token is invalid, the server returns `401`. If the token is valid, the request continues.
6. The server validates the score. It must be an integer from 1 to 10000000. If not, the server returns `400`.
7. The server inserts a row into the `scores` table with the user's id, the score, and the current time. It returns `201`.
8. Anyone can read the leaderboard with `GET /api/leaderboard`. No login is needed. It returns the top 20 scores as `[{username, score, created_at}]`, highest score first.

## How Auth Works (Step by Step)

1. **Register** — `POST /api/auth/register` with `{username, password}`. The server checks that the input is valid (400 if not). It checks that the username is not already taken (409 if it is). It hashes the password with bcrypt and saves the user. It returns `201 {id, username}`. No token is returned at this step.
2. **Login** — `POST /api/auth/login` with `{username, password}`. The server finds the user by username. It compares the given password with the stored bcrypt hash. If the user does not exist, or the password does not match, it returns `401`. If they match, the server signs a JWT with `JWT_SECRET` and returns `200 {token, username}`.
3. **JWT** — the token proves the user is logged in. The client sends it as `Authorization: Bearer <token>` on every protected request. The server checks the signature with `JWT_SECRET`. A token signed with a different secret is rejected.
4. **Score submit** — `POST /api/scores` is protected by `middleware/auth.js`. Without a valid token it returns `401`. With a valid token, the score is saved under that user's id.

## Folder Layout

```
number-merge-puzzle/
├── README.md
├── docs/
│   ├── ARCHITECTURE.md   (this file)
│   ├── API.md
│   ├── SECURITY.md
│   ├── TESTING.md
│   ├── PLAY-STORE.md
│   └── PRIVACY-POLICY.md
├── store/
│   └── listing.txt
├── client/
│   ├── index.html
│   ├── styles.css
│   ├── js/
│   │   ├── game-logic.js   (pure functions only, no DOM)
│   │   └── app.js          (DOM, input, display, localStorage)
│   └── tests/
│       └── game-logic.test.js
└── server/
    ├── server.js
    ├── db.js
    ├── routes/
    │   ├── auth.js
    │   └── scores.js
    ├── middleware/
    │   └── auth.js
    ├── tests/
    │   └── api.test.js
    ├── .env.example
    └── data.db
```

# Number Merge Puzzle

Number Merge Puzzle is an original 2048-style puzzle game.

You play on a 4x4 grid. You slide number tiles. When two tiles with the same number touch, they merge into one bigger tile. Your goal is to reach the 2048 tile.

The game is free to play. It works offline. You can play it in a web browser. You can also publish it as an Android app on Google Play. See `docs/PLAY-STORE.md` for the publishing steps.

## How to Play

- The board has 16 squares (4 rows x 4 columns).
- A new tile appears after every move. New tiles are 2 or 4.
- Slide the tiles up, down, left, or right.
- When two tiles with the same number meet, they merge into one tile. For example, 2 + 2 = 4. 4 + 4 = 8.
- Each merge adds points to your score.
- You win when you make a 2048 tile.
- The game ends when the board is full and no move is possible.
- Your best score is saved in your browser (localStorage). It stays there even after you close the page.

### Controls

- **Swipe:** swipe on the board on a touch screen.
- **Arrow keys:** use the Up, Down, Left, and Right arrow keys on a keyboard.
- **On-screen buttons:** tap the arrow buttons on the screen.
- **New Game:** start a fresh board.
- **Undo:** take back your last move. You can undo one step only.

## Project Structure

```
number-merge-puzzle/
├── README.md
├── docs/
│   ├── ARCHITECTURE.md
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
│   │   ├── game-logic.js
│   │   └── app.js
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

- `client/` is the game you play in the browser. It works on its own, without the server.
- `server/` is the optional backend. It stores user accounts and scores. It also powers the leaderboard.
- `docs/` holds all the documentation for this project.
- `store/` holds the Google Play store listing text.

## How to Run the Client

The client needs no build step and no server. You have two options.

### Option 1: Open the file directly

Open `client/index.html` in your web browser. Double-click the file, or use File > Open in the browser.

### Option 2: Serve it with a local web server

This option is better, because some browsers limit local files. Run these commands from the `client/` folder:

```bash
cd client
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

Note: the server's default `CORS_ORIGIN` is `http://localhost:8080`. If you serve the client on a different address, set `CORS_ORIGIN` in the server `.env` file to match it. See "How to Run the Server" below.

## How to Run the Server

The server is Node.js + Express + SQLite (better-sqlite3). Follow these steps in order.

### Step 1: Install the server dependencies

```bash
cd server
npm install
```

### Step 2: Create the .env file

Copy the example file, then edit it:

```bash
cp server/.env.example server/.env
```

Open `server/.env` and set a strong, secret value for `JWT_SECRET`. Do not share this value. Do not commit the `.env` file to Git.

The server uses these environment variables:

| Variable | Default | What it does |
|---|---|---|
| `JWT_SECRET` | (none — you must set it) | Secret used to sign login tokens (JWT). |
| `PORT` | `3000` | The port the server listens on. |
| `CORS_ORIGIN` | `http://localhost:8080` | The only web address allowed to call the API from a browser. |
| `DB_PATH` | `data.db` | The path of the SQLite database file. |

### Step 3: Start the server

```bash
cd server
npm start
```

The server starts on port `3000` by default. Check that it works:

```bash
curl http://localhost:3000/api/health
```

You should get this response:

```json
{"status":"ok","service":"number-merge-puzzle"}
```

The database file is `server/data.db`. It is created automatically on first start. It has two tables: `users` and `scores`. See `docs/ARCHITECTURE.md` for the table details.

## API Summary

The full API reference is in `docs/API.md`. Here is a short summary.

| Method | URL | Auth needed | What it does |
|---|---|---|---|
| GET | `/api/health` | No | Check that the server is running. Returns `200 {status:'ok', service:'number-merge-puzzle'}`. |
| POST | `/api/auth/register` | No | Create a new account. Body: `{username, password}`. Returns `201 {id, username}`. Bad input: `400`. Duplicate username: `409`. |
| POST | `/api/auth/login` | No | Log in. Body: `{username, password}`. Returns `200 {token, username}`. Wrong credentials: `401`. |
| POST | `/api/scores` | Yes — JWT Bearer token | Save a score. Body: `{score}`. Score must be an integer from 1 to 10000000. Returns `201`. Bad score: `400`. No token: `401`. |
| GET | `/api/leaderboard` | No | Get the top 20 scores. Returns `[{username, score, created_at}]`. |

## How to Run Tests

Tests use the Node.js built-in test runner (`node:test`). No extra test framework is needed.

Run all tests from the project root:

```bash
npm test
```

This runs both test suites:

- `client/tests/game-logic.test.js` — tests the game rules (moves, merges, win, game over).
- `server/tests/api.test.js` — tests the API (health, register, login, scores, leaderboard).

See `docs/TESTING.md` for the full list of test cases and how to run each suite alone.

## Security Notes (Summary)

- Passwords are hashed with bcrypt. Plain passwords are never stored.
- Login tokens (JWT) are signed with `JWT_SECRET` from the environment only. No secret is hard-coded.
- Helmet sets safe HTTP headers.
- Rate limiting protects the API: auth endpoints allow 10 requests per 15 minutes; score submissions allow 30 per minute.
- All user input is validated. Scores must be an integer from 1 to 10000000.
- All database queries use parameterized SQL. This stops SQL injection.
- CORS is restricted to `CORS_ORIGIN` only.
- Error responses never include stack traces.
- `.env` and `*.db` files are never committed to Git (see `.gitignore`).

The full details are in `docs/SECURITY.md`.

## Play Store Overview

This game can be published on Google Play as an Android app. The client folder is turned into an Android App Bundle with Capacitor, then opened in Android Studio, signed, and uploaded to the Play Console. Before production, the app must pass a closed testing track with at least 12 testers for 14 days. The full step-by-step guide, including the developer account, app signing, store listing, content rating, and privacy policy, is in `docs/PLAY-STORE.md`.

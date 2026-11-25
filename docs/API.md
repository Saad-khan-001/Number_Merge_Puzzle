# API Reference

Base URL (default): `http://localhost:3000`

The server listens on `PORT` (default `3000`). All endpoints start with `/api`.

All request and response bodies are JSON. Send the header `Content-Type: application/json` on POST requests.

Protected endpoints need a JWT. Send it as:

```
Authorization: Bearer <token>
```

You get a token from `POST /api/auth/login`.

## Endpoints at a Glance

| Method | URL | Auth needed | What it does |
|---|---|---|---|
| GET | `/api/health` | No | Check that the server is running. |
| POST | `/api/auth/register` | No | Create a new account. |
| POST | `/api/auth/login` | No | Log in and get a JWT. |
| POST | `/api/scores` | Yes — JWT Bearer token | Save a score. |
| GET | `/api/leaderboard` | No | Get the top 20 scores. |

---

## GET /api/health

Check that the server is running. Use this to test that the server started correctly.

- **Auth needed:** No.
- **Request body:** None.

### Success response

- **Status:** `200 OK`

```json
{
  "status": "ok",
  "service": "number-merge-puzzle"
}
```

### Error responses

None. If the server is running, this endpoint always returns `200`.

### curl example

```bash
curl http://localhost:3000/api/health
```

---

## POST /api/auth/register

Create a new account.

- **Auth needed:** No.
- **Request body (JSON):**

```json
{
  "username": "player1",
  "password": "secret123"
}
```

| Field | Type | Rules |
|---|---|---|
| `username` | string | Required. Must not be empty. Must be unique. |
| `password` | string | Required. Must not be empty. |

### Success response

- **Status:** `201 Created`

```json
{
  "id": 1,
  "username": "player1"
}
```

No token is returned here. Log in next to get a token.

### Error responses

| Status | When it happens | Example body |
|---|---|---|
| `400 Bad Request` | Bad input: username or password is missing or empty, or the wrong type. | `{"error": "Username and password are required."}` |
| `409 Conflict` | The username is already taken. | `{"error": "Username already exists."}` |

### curl example

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "player1", "password": "secret123"}'
```

---

## POST /api/auth/login

Log in with a username and password. Returns a JWT.

- **Auth needed:** No.
- **Request body (JSON):**

```json
{
  "username": "player1",
  "password": "secret123"
}
```

| Field | Type | Rules |
|---|---|---|
| `username` | string | Required. |
| `password` | string | Required. |

### Success response

- **Status:** `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "player1"
}
```

Save the `token`. Send it as `Authorization: Bearer <token>` on protected requests.

### Error responses

| Status | When it happens | Example body |
|---|---|---|
| `400 Bad Request` | Bad input: username or password is missing or empty. | `{"error": "Username and password are required."}` |
| `401 Unauthorized` | Wrong credentials: the user does not exist, or the password does not match. | `{"error": "Invalid username or password."}` |

### curl example

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "player1", "password": "secret123"}'
```

---

## POST /api/scores

Save a game score for the logged-in user.

- **Auth needed:** Yes. Send the JWT as `Authorization: Bearer <token>`.
- **Request body (JSON):**

```json
{
  "score": 1250
}
```

| Field | Type | Rules |
|---|---|---|
| `score` | integer | Required. Must be an integer from 1 to 10000000. |

### Success response

- **Status:** `201 Created`

```json
{
  "id": 1,
  "user_id": 1,
  "score": 1250,
  "created_at": "2026-11-25T10:00:00.000Z"
}
```

### Error responses

| Status | When it happens | Example body |
|---|---|---|
| `400 Bad Request` | The score is missing, not an integer, less than 1, or more than 10000000. | `{"error": "Score must be an integer between 1 and 10000000."}` |
| `401 Unauthorized` | No token was sent, or the token is missing, invalid, or expired. | `{"error": "No token provided."}` or `{"error": "Invalid token."}` |

### curl example

```bash
curl -X POST http://localhost:3000/api/scores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"score": 1250}'
```

Replace `<token>` with the real token from `POST /api/auth/login`.

---

## GET /api/leaderboard

Get the top 20 scores, highest score first. This endpoint is public. No login is needed.

- **Auth needed:** No.
- **Request body:** None.

### Success response

- **Status:** `200 OK`

```json
[
  {
    "username": "player1",
    "score": 1250,
    "created_at": "2026-11-25T10:00:00.000Z"
  },
  {
    "username": "player2",
    "score": 900,
    "created_at": "2026-11-25T09:30:00.000Z"
  }
]
```

If no scores exist yet, the response is an empty array: `[]`.

### Error responses

None for normal use.

### curl example

```bash
curl http://localhost:3000/api/leaderboard
```

---

## Common Notes

- All POST requests need the header `Content-Type: application/json`.
- Error responses are always JSON with an `error` field. They never include stack traces.
- If the server is not running, `curl` will fail to connect. Start the server first with `cd server && npm start`.
- Rate limits apply: auth endpoints allow 10 requests per 15 minutes; score submissions allow 30 per minute. If you hit the limit, the server returns `429 Too Many Requests`. Wait and try again. See `docs/SECURITY.md`.

# Security

This document lists every security control in the Number Merge Puzzle project and explains why each one matters.

## 1. bcrypt Password Hashing

**What it is:** Passwords are hashed with bcrypt before they are stored. The plain password is never saved in the database. Only the hash is saved in the `users.password_hash` column.

**Why it matters:** If someone steals the database file (`server/data.db`), they still do not get the users' passwords. A bcrypt hash cannot be turned back into the original password. Bcrypt is also slow on purpose, so guessing passwords by trying millions of options takes too long to be useful.

**Rules:**
- Never store a plain password.
- Never log a password.
- Never send a password back to the client in any response.

## 2. JWT Secret from the Environment Only

**What it is:** Login tokens (JWT) are signed with `JWT_SECRET`. This value comes only from the environment (the `server/.env` file). It is never hard-coded in the source code.

**Why it matters:** The JWT secret is the key that proves a token is real. If it leaks, anyone can forge a valid login token for any user. If it is hard-coded in the code, it leaks as soon as the code is shared or published. Keeping it in the environment keeps it out of the code.

**Rules:**
- Set a long, random `JWT_SECRET` in `server/.env`. Use a different secret for each environment (development, production).
- Never commit `server/.env` to Git.
- Never put the secret in a client file. The client only receives the signed token, never the secret.

## 3. Helmet Headers

**What it is:** The server uses Helmet. Helmet sets safe HTTP response headers automatically.

**Why it matters:** These headers tell the browser how to behave. They block common attacks, such as:
- loading the site inside another site's frame (clickjacking),
- running scripts from untrusted sources,
- guessing the type of a file and running it as code.

Without these headers, the browser uses its less-safe defaults.

## 4. Rate Limiting

**What it is:** The server limits how many requests one client can make in a short time.

| Endpoints | Limit |
|---|---|
| Auth endpoints (`/api/auth/register`, `/api/auth/login`) | 10 requests per 15 minutes |
| Score submissions (`POST /api/scores`) | 30 requests per minute |

If the limit is passed, the server returns `429 Too Many Requests`.

**Why it matters:** Rate limiting slows down attackers. Without it, an attacker can:
- try thousands of passwords against one account (brute force),
- create thousands of fake accounts,
- flood the server with fake scores.

The auth limit is strict because login is the most attacked endpoint. The scores limit is looser, because a real player only saves a score once per game.

## 5. Input Validation

**What it is:** The server checks every value the client sends before it uses it.

- Register and login: `username` and `password` must be present, must be strings, and must not be empty. Bad input returns `400`.
- Score submit: `score` must be an integer from 1 to 10000000. Anything else returns `400`. This rejects missing scores, text, decimals, zero, negative numbers, and huge numbers.

**Why it matters:** Bad input is the most common cause of bugs and attacks. A score of `999999999999` or a score of `"hello"` should never reach the database. Validation keeps the data clean and stops many attacks before they start.

## 6. Parameterized SQL Only

**What it is:** Every database query uses parameters. User input is passed as a parameter value, never pasted into the SQL string.

Example of the safe way (concept):

```js
db.prepare('SELECT * FROM users WHERE username = ?').get(username);
```

The unsafe way, which this project never uses, would be:

```js
// NEVER DO THIS:
db.prepare(`SELECT * FROM users WHERE username = '${username}'`).get();
```

**Why it matters:** Pasting user input into SQL allows SQL injection. An attacker can send a username like `' OR '1'='1` and trick the database into returning other users' data, or deleting data. Parameterized queries treat the input as plain data only. The database never runs it as code. This one control stops SQL injection completely.

## 7. Restricted CORS

**What it is:** CORS (Cross-Origin Resource Sharing) is restricted to `CORS_ORIGIN` only. The default is `http://localhost:8080`. A browser page from any other address cannot call the API.

**Why it matters:** Without this limit, any website on the internet could make requests to the API from a visitor's browser. That opens the door to cross-site attacks. Restricting CORS to the game's own address means only the real game client can call the API from a browser.

**Rule:** In production, set `CORS_ORIGIN` to the real address of the game (for example, your domain or your Play Store app's web address). Never set it to `*` (allow all) in production.

## 8. Safe Error Handling

**What it is:** Error responses are short, general messages. They never include stack traces, file paths, or internal details.

Example of a safe error:

```json
{"error": "Invalid username or password."}
```

**Why it matters:** Stack traces tell an attacker how the code works: file names, library versions, database details. That information helps them find the next weakness. Also, login errors never say whether the username or the password was wrong. If the error said "user not found", an attacker could use it to find out which usernames exist.

**Rules:**
- Log full errors on the server only, for the developer to read.
- Send only a short message to the client.
- Always return `401` for both "user does not exist" and "wrong password".

## 9. .gitignore for .env and *.db

**What it is:** The project's `.gitignore` file excludes:

- `.env` and `server/.env` — files that hold secrets.
- `*.db` and `server/data.db` — the database file, which holds user accounts and password hashes.

**Why it matters:** A secret or a database that is committed to Git is very hard to remove. Even if you delete the file later, it stays in the Git history. Anyone who clones the repo can read it. Ignoring these files from the start stops the leak before it happens.

**Rule:** Before the first commit, check that `.gitignore` covers `.env` and `*.db`. Never use `git add -f` to force-add them.

## 10. No Secrets Committed

**What it is:** No password, token, API key, or secret is ever written in the source code, in the documentation, or in a test file.

**Why it matters:** Code is shared, copied, and sometimes published. A secret in the code becomes public the moment the code becomes public. All secrets live only in the `.env` file, which is never committed.

## What to Do If a Secret Leaks

If `JWT_SECRET` (or any secret) leaks — for example, it was committed to Git, pasted in a chat, or seen by someone who should not have it — act at once:

1. **Stop the server.**
2. **Create a new secret.** Make a new, long, random value for `JWT_SECRET`. Do not reuse the old one.
3. **Update `server/.env`** with the new secret.
4. **Force re-login for all users.** Every JWT signed with the old secret is now invalid, because the server checks tokens with the new secret. All users must log in again to get a new token. This is expected. Do not try to keep old tokens working.
5. **Remove the leaked secret from Git history.** If the secret was committed, delete it from the repo history (for example with `git filter-repo` or by deleting the repo and pushing a clean copy). Just deleting the file in a new commit is not enough — the old commit still holds it.
6. **Check the logs** for unusual activity (many failed logins, many score submissions, unknown usernames) around the time of the leak.
7. **Restart the server** with the new secret and test login again.

If the database file (`server/data.db`) leaks, the passwords are still protected by bcrypt, but treat it as serious: tell users, force a password change if your app supports it, and rotate `JWT_SECRET` as well, because the leaked database holds user ids and usernames.

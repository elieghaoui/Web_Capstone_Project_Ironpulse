# IRONPULSE security audit (lecture 21 lab)

We attacked our own API with the seven checks from the Session 21 checklist,
fixed what got through, and re-ran the same attack. Every "after" can be re-run
with the Thunder Client collections in `docs/api/` (folder **4. Bob can't touch
Alice's data** in collection 1 and **6. Security checks** in collection 2); each request
checks the expected status code.

| Hole | Attack we ran | Before | Fix | After |
| --- | --- | --- | --- | --- |
| **IDOR** | Bob sends `GET`, `PATCH` and `DELETE /api/bookings/<Alice's id>` with his own token | Bookings didn't exist yet | Every booking query filters by `userId: req.userId`; the owner is always taken from the token, never from the body | **404** `Booking not found` for all three; Alice's booking is untouched |
| **Injection** (login) | `POST /api/auth/login` with `{"email": {"$ne": null}, "password": {"$ne": null}}` | The object reached our route code; only a hand-written `typeof` check stood between it and MongoDB | zod `LoginInput` (strings only) + `mongoose.set('sanitizeFilter', true)` as a backstop | **400** `Email is required`, before MongoDB is touched |
| **Injection** (query) | `GET /api/classes?category[$ne]=x` | The object was silently ignored and **every** class was returned | Express 5's simple query parser no longer turns `[$ne]` into an object, and every query string is validated with zod (known keys only, `category` must be a real category) | **400** `Unrecognized key: "category[$ne]"` |
| **Brute force** | 6 wrong passwords in a row | 10 tries allowed per 15 minutes | Login limiter: **5** wrong tries per 15 min (correct logins don't count), plus 300 requests / 15 min on all of `/api` | 6th wrong try: **429** `Too many attempts. Try again later.` |
| **Mass assignment** | Signup with `"role": "admin"`; booking with `"userId": "<someone else>"` | Already safe for signup: the route never read `role` | zod drops every undeclared key, so `role`, `userId`, `status` can never be set from a request | **201**, account created as `member`; bookings always belong to the caller |
| **Big payloads** | Signup with a 20 kB name | Bodies up to 100 kB reached the database layer | `express.json({ limit: '10kb' })`, `.max()` on every string, oversized body handled in the error handler | **413** `Request body too large` |
| **XSS** | Name `<img src=x onerror=alert(1)>` | Already safe: React escapes text, no `dangerouslySetInnerHTML` anywhere | Kept it that way; helmet sends a Content-Security-Policy | Shown as plain text on the dashboard |
| **Headers** | `curl -I localhost:3000/api/health` | `X-Powered-By: Express` advertised, no security headers | `app.use(helmet())` first, before routes | CSP, HSTS, `nosniff` present; `X-Powered-By` hidden |
| **Secrets** | Start the API without `JWT_SECRET`; `git log -p \| grep SECRET` | Started anyway and only failed on the first login | `checkEnv()` crashes at startup if `MONGODB_URI` or `JWT_SECRET` is missing; `.env` files are git-ignored, `.env.example` has names only | Startup error `Missing env var: JWT_SECRET`; no secret in the repo |

## A bug we found on the way

`sanitizeFilter` neutralises **every** `$` operator in a query, including our own
(`startsAt: { $gte: now }` became "starts at exactly `{ $gte: now }`" and matched nothing,
so no upcoming classes showed). Our own operators are now wrapped in
`mongoose.trusted({ $gte: now })`; attacker input is still neutralised.

## Other protections already in place

- Passwords hashed with bcrypt (cost 12); the hash is removed from every JSON response.
- Login gives the same message for a wrong email or a wrong password.
- JWT sent in the `Authorization: Bearer` header (not a cookie), so other sites can't forge requests with it (CSRF).
- `requireAuth` returns 401 for a missing, forged or expired token; `requireAdmin` returns 403.
- A malformed id (`/api/bookings/xyz`) gets 400 `Invalid id` before the database is asked (lecture 18).
- Express 5 sends errors thrown in `async` routes to the error handler, so a database problem gives a JSON 500 instead of crashing the server.
- CORS only allows our own front end (`CLIENT_ORIGIN`). `trust proxy` is set so the rate limiter sees real IPs once deployed.

## Still to do

- **HTTPS:** production URLs and `CLIENT_ORIGIN` will use `https://` when we deploy (Milestone 4).

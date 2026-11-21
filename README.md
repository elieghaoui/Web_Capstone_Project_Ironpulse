# IRONPULSE Gym

A full-stack web app for IRONPULSE, a gym in Beirut. Members choose a membership plan, book group classes with limited spots and book 1-hour sessions with personal trainers. Staff manage plans, trainers, classes and bookings from an admin panel.

**Team:** Adam Bou Ghosn, Elie El Ghaoui · Web Programming capstone

| | Live address |
| --- | --- |
| **App** (Vercel) | **https://ironpulse-inky-xi.vercel.app** |
| **API** (Render) | **https://ironpulse-api-rss4.onrender.com** · health check: [`/api/health`](https://ironpulse-api-rss4.onrender.com/api/health) |

The API runs on Render's free plan, which sleeps when nobody uses it: the first request after a while can take about 30 seconds.

## Features

- **Accounts:** sign up, log in, log out; members and admins (bcrypt + JWT).
- **Membership plans:** five plans (Basic to Athlete). Each plan includes a number of group classes and PT sessions per 30-day period.
- **Class booking:** weekly schedule filtered by type, live "spots left", no double booking, full classes refused.
- **Personal training:** trainer profiles, free 1-hour slots inside each trainer's hours (Beirut time), no overlapping sessions.
- **My bookings:** list, add a note ("knee injury, go easy"), cancel up to 12 hours before (the credit comes back).
- **Admin:** create, edit and delete plans, trainers and classes; see every booking.
- **Beyond CRUD:** all booking rules (capacity, plan limits per 30-day period, trainer hours, cancellation window) are checked on the server.
- **Design:** dark, animated UI built with CSS transitions and keyframes; responsive on phone and desktop.

## Design (Milestone 1)

- **[Wireframes](docs/wireframes.png)**: every main screen, low-fi, with arrows for how users move between them.
- **[Database schema](docs/schema.md)**: every collection with its fields, types and references, plus which screen uses which data.

## Tech stack

| Layer | Choice |
| --- | --- |
| Front end | React + Vite, React Router, plain CSS (design tokens, transitions, keyframes) |
| Back end | Node.js 20+ and Express 5 (REST API under `/api`) |
| Database | MongoDB Atlas with Mongoose |
| Auth | bcrypt password hashing + JWT (1 hour), `requireAuth` / `requireAdmin` middleware |
| Validation & security | zod, helmet, express-rate-limit, Mongoose `sanitizeFilter` |
| Tests | Vitest + Supertest (API), Vitest + React Testing Library + jsdom (components) |
| API testing | Thunder Client collection in `docs/api/` |

## Architecture

```
 React (Vite, :5173)                 Express API (:3000)                          MongoDB Atlas
 ┌────────────────────┐   fetch   ┌───────────────────────────────────────┐   Mongoose   ┌──────────────┐
 │ pages / components │ ────────► │ logger → helmet → cors → express.json │ ───────────► │ users        │
 │ useApi (hook)      │  Bearer   │ → rate limits → router                │              │ plans        │
 │ api/client.js      │   token   │ → requireAuth / requireAdmin          │ ◄─────────── │ trainers     │
 │ AuthContext        │ ◄──────── │ → validate (zod) → route handler      │              │ gymclasses   │
 └────────────────────┘   JSON    │ → errorHandler (JSON errors)          │              │ bookings     │
                                  └───────────────────────────────────────┘              └──────────────┘
```

- The browser only talks to the API; only the API talks to the database.
- The login token is kept in `localStorage` and sent as `Authorization: Bearer <token>` by `api/client.js` on every request. A 401 logs the user out.
- Every private query is filtered by the logged-in user (`userId: req.userId`).

## Project structure

```
ironpulse/
├── .github/workflows/      ci.yml (tests on every push)
├── docs/                   wireframes.png, schema.md, api/ (Thunder Client collection)
├── SECURITY.md             security audit (lecture 21)
├── PERFORMANCE.md          Lighthouse before / fix / after (lecture 22)
├── client/                 React app (Vite)
│   └── src/
│       ├── api/client.js   apiFetch: base URL, token header, errors, 401 -> auth:expired
│       ├── hooks/          useApi (data / loading / error / reload), useReveal (scroll animations)
│       ├── auth/           AuthContext (token in localStorage + state, login, signup, logout)
│       ├── components/     Navbar, Footer, Reveal, PageTransition, ProtectedRoute, Status,
│       │                   PlanCard, ClassRow, SlotPicker, BookingCard (+ .test.jsx files)
│       │   └── admin/      ClassesAdmin, TrainersAdmin, PlansAdmin, BookingsAdmin,
│       │                   HoursEditor, FilterGroup, ConfirmDelete (+ test)
│       ├── pages/          Home, Plans, Classes, Trainers, TrainerProfile, Login, Signup, Dashboard, Admin
│       └── styles/         global.css (design tokens, components, animations)
└── server/                 Express API
    ├── server.js           connects to MongoDB, then listens
    ├── app.js              builds the app: middleware + routes (exported for testing)
    ├── config.js           crashes at startup if a secret is missing
    ├── seed.js             fills the database with plans, trainers and classes
    ├── models/             User, Plan, Trainer, GymClass, Booking
    ├── routes/             auth, me, plans, trainers, classes, bookings
    ├── middleware/         logger, requireAuth / requireAdmin, validate (zod rules), errorHandler
    ├── auth/token.js       sign / verify JWTs
    ├── tests/              api.test.js (Supertest)
    └── utils/              time.js (trainer hours in Beirut time), planCycle.js (30-day plan limits)
```

## Setup

You need Node.js 20 or later and a free MongoDB Atlas cluster.

### 1. API

```bash
cd server
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

Open `server/.env` and fill in `MONGODB_URI` (from Atlas), a long random `JWT_SECRET`, `CLIENT_URL` and an `ADMIN_PASSWORD`. Then:

```bash
npm run seed    # resets plans, trainers, 2 weeks of classes, bookings and member accounts; keeps/creates the admin
npm run seed:classes   # later: only adds the next 4 weeks of classes (deletes nothing)
npm run dev     # API on http://localhost:3000 (node --watch restarts it on every save)
```

### 2. Front end (second terminal)

```bash
cd client
npm install
cp .env.example .env.development   # Windows: copy .env.example .env.development
npm run dev     # app on http://localhost:5173
```

`VITE_API_URL` tells React where the API is. Restart `npm run dev` after changing it.

### Configuration

| Setting | Development | Production |
| --- | --- | --- |
| `VITE_API_URL` (client) | `http://localhost:3000` | the live API address |
| `CLIENT_URL` (server) | `http://localhost:5173` | the live site address (no trailing `/`) |
| `MONGODB_URI`, `JWT_SECRET` (server) | `server/.env` on your laptop | the host's settings page |

Every `VITE_` value ships to the browser, so secrets only ever go in `server/.env`. Both `.env` files are git-ignored.

## API routes

| Method | Route | Access | Success | What it does |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | Public | 200 | `{ "ok": true }` |
| POST | `/api/auth/signup` | Public | 201 | Create a member account, returns `{ token, user }` |
| POST | `/api/auth/login` | Public (5 wrong tries / 15 min) | 200 | Returns `{ token, user }` |
| GET | `/api/auth/me` | Logged in | 200 | Who am I (with my plan) |
| GET | `/api/me/plan` | Logged in | 200 | My plan, current 30-day period, classes and PT sessions used |
| PUT | `/api/me/plan` | Logged in | 200 | Choose or switch plan (starts a new 30-day period) |
| GET | `/api/plans`, `/api/plans/:id` | Public | 200 | Plans |
| POST · PATCH · DELETE | `/api/plans`, `/api/plans/:id` | Admin | 201 · 200 · 204 | Manage plans |
| GET | `/api/trainers`, `/api/trainers/:id` | Public | 200 | Trainers |
| GET | `/api/trainers/:id/slots?days=14` | Public | 200 | Free 1-hour PT start times |
| POST · PATCH · DELETE | `/api/trainers`, `/api/trainers/:id` | Admin | 201 · 200 · 204 | Manage trainers |
| GET | `/api/classes?category=Yoga`, `/api/classes/:id` | Public | 200 | Upcoming classes with `spotsLeft` |
| POST · PATCH · DELETE | `/api/classes`, `/api/classes/:id` | Admin | 201 · 200 · 204 | Manage classes |
| DELETE | `/api/classes/:id?cancelBookings=true` | Admin | 204 | Cancel a booked class: its bookings become `cancelled`, then the class is removed |
| GET | `/api/bookings` | Logged in | 200 | Members: my upcoming bookings · Admin: all (`?status=booked&type=class`) |
| POST | `/api/bookings` | Logged in | 201 | Book a class or a PT session |
| GET · PATCH · DELETE | `/api/bookings/:id` | Owner (DELETE: owner or admin) | 200 · 200 · 204 | Read, change the note, cancel |

Status codes: 200 OK, 201 created, 204 done (no body), 400 bad input or malformed id, 401 not logged in, 403 not allowed (admins only, plan limit), 404 not found or not yours, 409 conflict (full, already booked, still in use), 413 body too large, 429 too many login attempts.

### Example bodies

```jsonc
// POST /api/auth/signup
{ "name": "Alice Member", "email": "alice@example.com", "password": "alicepass123" }

// PUT /api/me/plan
{ "planId": "6735f2c4b7a1d3f0c8e2a9b1" }

// POST /api/bookings: a class
{ "type": "class", "classId": "6735f2c4b7a1d3f0c8e2a9c7", "note": "First class!" }

// POST /api/bookings: a 1-hour PT session (Beirut time, on the hour)
{ "type": "pt", "trainerId": "6735f2c4b7a1d3f0c8e2a9b3", "startsAt": "2026-11-23T09:00:00+02:00" }

// PATCH /api/bookings/:id
{ "note": "Bringing a friend next time" }

// POST /api/classes (admin)
{ "title": "Sunrise Stretch", "category": "Mobility", "room": "Studio B",
  "trainerId": "6735f2c4b7a1d3f0c8e2a9b3", "startsAt": "2030-01-05T08:00:00+02:00",
  "durationMin": 30, "capacity": 15 }

// POST /api/plans (admin)
{ "name": "Student", "priceMonthly": 35, "classesPerMonth": 8, "ptSessionsPerMonth": 0,
  "perks": ["Valid student ID required"] }

// Errors always look like this:
{ "error": "This class is full" }
```

### Booking rules (checked on the server)

- Classes: the class must not have started, not be full, and not already be booked by you.
- PT: 1 hour, starting on the hour, inside the trainer's weekly hours (Beirut time), and the slot must be free.
- Plan limits: each plan includes a number of classes and PT sessions per **30-day period** starting the day you chose the plan (Basic: none; Elite and up: unlimited classes). No plan, or limit reached: 403.
- Cancelling: up to **12 hours** before the start. The booking is kept as `cancelled` and no longer counts toward your limit.
- The gym (admin) can cancel any member's booking at any time, or cancel a whole class with **Cancel class**; members get their credit back either way.
- Every member booking query is filtered by the logged-in user: someone else's booking id gives **404**.
- Admins can't simply delete a class with bookings (409: cancel it instead), a trainer with classes or sessions, or a plan members are on (409).

## Automated tests (Session 22)

```bash
cd server && npm test   # 9 tests
cd client && npm test   # 8 tests
```

- **API** (`server/tests/api.test.js`, Vitest + Supertest against `app.js`, no database needed): missing or forged token → 401, unknown booking type → 400, malformed id → 400, short password on signup → 400, `{"$ne": null}` login injection → 400, member creating a plan → 403, member cancelling a class → 403, bad `cancelBookings` value → 400.
- **Components** (`client/src/components/*.test.jsx`, Vitest + React Testing Library + user-event): `ClassRow` shows the class, calls `onBook` with the class id, disables *Book* when the class is full and shows *Booked ✓* instead of a button; `BookingCard` asks for confirmation before cancelling and hides *Cancel* less than 12 hours before the start; the admin `ConfirmDelete` button only deletes after the second click and shows the server's message when a delete is refused (409).
- We checked the tests can fail: changing `onBook(gymClass._id)` to `onBook('oops')` in `ClassRow.jsx` makes "calls onBook with the class id" fail.
- `npm run test:watch` re-runs the tests on every save.

See **[PERFORMANCE.md](PERFORMANCE.md)** for the Lighthouse audit (before, fix, after).

## Testing the API (Thunder Client)

Every route can be tried without the front end, using the **Thunder Client** extension in VS Code. The requests are split into two collections because the free version allows 50 requests per collection:

| File | Folders |
| --- | --- |
| `docs/api/thunder-collection_IRONPULSE-1-members.json` | 1 public routes · 2 accounts · 3 Alice's plan and bookings · 4 **Bob can't touch Alice's data** |
| `docs/api/thunder-collection_IRONPULSE-2-admin-security.json` | 5 admin · 6 security checks |

1. Run `npm run seed`, then start the API (`npm run dev` in `server/`).
2. In Thunder Client: **Collections → ⋯ → Import** both collection files, and **Env → ⋯ → Import** `docs/api/thunder-environment_IRONPULSE-local.json`.
3. Open the **IRONPULSE local** environment, check `baseUrl` (`http://localhost:3000`), `adminEmail`, `adminPassword` (your `ADMIN_PASSWORD`) and `forgedToken` (`abc.def.ghi`), and set it **active**.
4. **Run All** on collection 1, then on collection 2 (it uses the tokens and ids that collection 1 saved). Every request checks its expected status code.

The last request ("Wrong password") locks logins for 15 minutes after the 6th try; restart the API to reset it.

## Security

See **[SECURITY.md](SECURITY.md)** for our audit of the Session 21 checklist (attack, before, fix, after). In short:

- Every request body is validated with **zod** (wrong type or shape: 400; unknown keys such as `role` or `userId` are dropped; `.max()` on every string).
- `mongoose.set('sanitizeFilter', true)` blocks `$ne`-style NoSQL injection (our own `$gte` filters are wrapped in `mongoose.trusted`); query strings are validated too, and malformed ids get 400.
- Ownership always comes from the token (`req.userId`), never from the request body; other members' bookings return 404.
- Passwords hashed with bcrypt (cost 12); same error for a wrong email or a wrong password.
- Rate limits: 5 wrong logins per 15 minutes, 300 requests per 15 minutes on `/api`; bodies capped at 10 kB.
- `helmet()` sets secure headers and hides `X-Powered-By`; CORS only allows our front end.
- Secrets live in `.env` (git-ignored); the API refuses to start without `MONGODB_URI` and `JWT_SECRET`.

## Deployment (Session 23)

Three pieces, three hosts: the React app on **Vercel**, the Express API on **Render**, the data on **MongoDB Atlas**. The browser only talks to the API; only the API talks to the database.

**1. Database (Atlas):** in *Network Access*, allow `0.0.0.0/0` (Render's address changes). Use a database user whose password has only letters and numbers.

**2. API (Render → New → Web Service, from this GitHub repo):**

| Field | Value |
| --- | --- |
| Root directory | `server` |
| Build command | `npm ci` |
| Start command | `npm start` |
| Environment variables | `MONGODB_URI`, `JWT_SECRET` (a **new** long random one, not the dev one), `CLIENT_URL` (the Vercel address, no trailing `/`), `NODE_ENV=production` |

Render sets `PORT` itself; `server.js` reads it. Check: open `<API address>/api/health` → `{"ok":true}`.

**3. Front end (Vercel → Add New → Project, from this GitHub repo):**

| Field | Value |
| --- | --- |
| Root directory | `client` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variable | `VITE_API_URL` = the Render address (no trailing `/`) |

`client/vercel.json` sends every path to `index.html`, so refreshing `/classes` or `/dashboard` doesn't 404. `VITE_` values are baked in at build time: after changing one, redeploy.

**4. Connect them:** put the Vercel address in Render's `CLIENT_URL` and redeploy the API. Every push to `main` redeploys both.

**CI:** `.github/workflows/ci.yml` runs `npm ci` + `npm test` in `server/` and `client/` on every push and pull request (GitHub → *Actions* tab).

**If something breaks:** "blocked by CORS policy" → `CLIENT_URL` doesn't match the site address exactly · requests go to `localhost` → `VITE_API_URL` wasn't set at build time, redeploy · 404 on refresh → missing rewrite · API exits on start → a missing env var or Atlas blocking the IP (see Render's logs).

## Milestones

- [x] Proposal (Session 19)
- [x] Milestone 1: scaffold, wireframes and schema (Session 20)
- [x] Milestone 2: auth + CRUD routes working (Session 21)
- [x] Milestone 3: front end connected, booking works, tests and performance (Session 22)
- [x] Milestone 4: deployed on Vercel + Render + Atlas, CI on GitHub Actions (Session 23)
- [ ] Final demo (Session 24)

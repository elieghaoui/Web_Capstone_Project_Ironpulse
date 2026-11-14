# IRONPULSE Gym

A full-stack web app for a fictional gym. Members choose a membership plan, book group classes with limited spots and book sessions with personal trainers. Staff manage everything from an admin panel.

**Team:** Adam Bou Ghosn, Elie El Ghaoui · Web Programming capstone

## Design (Milestone 1)

- **[Wireframes](docs/wireframes.png)**: every main screen, low-fi, with arrows for how users move between them.
- **[Database schema](docs/schema.md)**: every collection with its fields, types and references, plus which screen uses which data.

## Tech stack

| Layer | Choice |
| --- | --- |
| Front end | React + Vite, React Router, Framer Motion, plain CSS |
| Back end | Node.js 20+ and Express (REST API under `/api`) |
| Database | MongoDB Atlas with Mongoose |
| Auth | bcrypt password hashing + JWT (1 hour), `requireAuth` / `requireAdmin` middleware |

## Project structure

```
ironpulse/
├── docs/                   wireframes + database schema (Milestone 1)
├── client/                 React app (Vite)
│   └── src/
│       ├── api/client.js   apiFetch: base URL, token header, errors, 401 -> auth:expired
│       ├── hooks/useApi.js data / loading / error / reload for any GET route
│       ├── auth/           AuthContext (token in localStorage + state, login, signup, logout)
│       ├── components/     Navbar, Footer, Reveal, PageTransition, ProtectedRoute, Status
│       ├── pages/          Home, Plans, Classes, Trainers, TrainerProfile, Login, Signup, Dashboard, Admin
│       └── styles/         global.css (dark theme, animations)
└── server/                 Express API
    ├── src/
    │   ├── models/         User, Plan, Trainer, GymClass, Booking
    │   ├── routes/         auth.js, public.js
    │   ├── middleware/     requireAuth, requireAdmin, errorHandler
    │   ├── auth/token.js   sign / verify JWTs
    │   ├── app.js          builds the Express app
    │   ├── server.js       connects to MongoDB and starts listening
    │   └── seed.js         fills the database with plans, trainers and classes
```

## Setup

You need Node.js 20 or later and a free MongoDB Atlas cluster.

### 1. API

```bash
cd server
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

Open `server/.env` and fill in `MONGODB_URI` (from Atlas), a long random `JWT_SECRET`, `CLIENT_ORIGIN` and an `ADMIN_PASSWORD`. Then:

```bash
npm run seed    # adds plans, trainers, 2 weeks of classes and the admin account
npm run dev     # API on http://localhost:3000
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
| `CLIENT_ORIGIN` (server) | `http://localhost:5173` | the live site address (no trailing `/`) |
| `MONGODB_URI`, `JWT_SECRET` (server) | `server/.env` on your laptop | the host's settings page |

Every `VITE_` value ships to the browser, so secrets only ever go in `server/.env`. Both `.env` files are git-ignored.

## API routes

| Method | Route | Access | Status |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Done |
| POST | `/api/auth/signup` | Public | Done |
| POST | `/api/auth/login` | Public | Done |
| GET | `/api/auth/me` | Member | Done |
| GET | `/api/plans`, `/api/trainers`, `/api/trainers/:id` | Public | Done |
| GET | `/api/classes?category=Yoga` | Public | Done (includes `spotsLeft`) |
| POST | `/api/me/plan` | Member | Milestone 2 |
| GET | `/api/me/bookings` | Member | Milestone 2 |
| POST | `/api/bookings` | Member | Milestone 2 |
| DELETE | `/api/bookings/:id` | Member (owner) | Milestone 2 |
| POST, PUT, DELETE | `/api/classes`, `/api/trainers`, `/api/plans` | Admin | Milestone 2 |
| GET | `/api/admin/bookings` | Admin | Milestone 2 |

Status codes: 400 bad input, 401 not logged in, 403 not an admin, 404 not found or not yours, 409 already exists / class full.

## Security

- Passwords are hashed with bcrypt (cost 12) and the hash is never sent back.
- Login gives the same error for a wrong email or a wrong password.
- New accounts are always members; `role` is never read from the request.
- Secrets live in `.env`, which is in `.gitignore`. Only `.env.example` is committed.
- CORS only allows our front end (`CLIENT_ORIGIN`).
- Mongoose validates every field; malformed JSON or bad ids return JSON errors instead of crashing.

## Milestones

- [x] Proposal (Session 19)
- [x] Milestone 1: scaffold, wireframes and schema (Session 20)
- [ ] Milestone 2: auth + CRUD routes working (Session 21)
- [ ] Milestone 3: front end connected, booking works (Session 22)
- [ ] Milestone 4: deployed (Session 23)
- [ ] Final demo (Session 24)

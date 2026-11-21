import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { logger } from './middleware/logger.js';
import { requireAuth } from './middleware/requireAuth.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import meRouter from './routes/me.js';
import plansRouter from './routes/plans.js';
import trainersRouter from './routes/trainers.js';
import classesRouter from './routes/classes.js';
import bookingsRouter from './routes/bookings.js';

// Backstop against NoSQL injection (lecture 21): filters like { $ne: ... } coming
// from user input are treated as plain values. Our OWN operators ($gte, $lt...)
// are wrapped in mongoose.trusted(...), otherwise they'd be neutralised too.
mongoose.set('sanitizeFilter', true);

// app.js builds the app, server.js connects and listens (lecture 22: split app from listen).
const app = express();

// Render puts a proxy in front of us: trust it so the rate limiter sees real IPs.
app.set('trust proxy', 1);

app.use(logger); // lecture 16: runs first, prints every request
app.use(helmet()); // secure headers, hides X-Powered-By
// Only our React app may call the API from a browser (lecture 23: CLIENT_URL).
// No trailing / in the address! server.js refuses to start if it's missing.
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: '10kb' })); // fills req.body, caps its size

const apiLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 300 });
const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  skipSuccessfulRequests: true, // only wrong passwords count
  message: { error: 'Too many attempts. Try again later.' },
});
app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);

// A route the host can ping (lecture 23)
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter); // public: signup, login (+ protected /me)
app.use('/api/me', requireAuth, meRouter); // members: my plan
app.use('/api/plans', plansRouter); // read: public · write: admin
app.use('/api/trainers', trainersRouter); // read: public · write: admin
app.use('/api/classes', classesRouter); // read: public · write: admin
app.use('/api/bookings', requireAuth, bookingsRouter); // members: their own bookings · admin: all

// after all routes: nothing matched
app.use(notFound);
app.use(errorHandler);

export default app;

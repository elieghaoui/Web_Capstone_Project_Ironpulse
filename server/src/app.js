import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import publicRouter from './routes/public.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// The app is built here and started in server.js,
// so tests can use it without opening a real port.
export function createApp() {
  const app = express();

  // Only our React app may call the API from a browser. No trailing / in the origin!
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRouter); // public: signup, login (+ protected /me)
  app.use('/api', publicRouter); // public: plans, trainers, classes

  // Coming in Milestone 2:
  // app.use('/api/me', requireAuth, meRouter);              // choose a plan, my bookings
  // app.use('/api/bookings', requireAuth, bookingsRouter);  // book / cancel with all the rules
  // app.use('/api/admin', requireAuth, requireAdmin, adminRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

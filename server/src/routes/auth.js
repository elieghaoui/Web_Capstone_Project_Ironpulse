import express from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { signToken } from '../auth/token.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

function cleanEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

// POST /api/auth/signup  -> 201 { token, user }
router.post('/signup', async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = cleanEmail(req.body.email);
    const { password } = req.body;

    if (!name || !email || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Name, email and an 8+ character password are required' });
    }
    if (await User.findOne({ email })) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    // role is never taken from the request body: everyone signs up as a member.
    const user = await User.create({ name, email, passwordHash });
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login  -> 200 { token, user }
router.post('/login', async (req, res, next) => {
  try {
    const email = cleanEmail(req.body.email);
    const { password } = req.body;
    const user = await User.findOne({ email });
    const ok = user && typeof password === 'string' && (await bcrypt.compare(password, user.passwordHash));
    // Same message either way, so attackers can't tell which emails exist.
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me  -> the logged-in user (protected)
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate('plan');
    if (!user) return res.status(401).json({ error: 'User no longer exists' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;

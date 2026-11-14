import express from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { signToken } from '../auth/token.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate, SignupInput, LoginInput } from '../middleware/validate.js';

const authRouter = express.Router();

// POST /api/auth/signup  -> 201 { token, user }
// req.body was already checked and cleaned by validate(SignupInput).
authRouter.post('/signup', validate(SignupInput), async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ email })) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  // role is never taken from the request body: everyone signs up as a member.
  const user = await User.create({ name, email, passwordHash });
  res.status(201).json({ token: signToken(user), user });
});

// POST /api/auth/login  -> 200 { token, user }   (5 wrong tries per 15 min, see app.js)
authRouter.post('/login', validate(LoginInput), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  // Same message either way, so attackers can't tell which emails exist.
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: signToken(user), user });
});

// GET /api/auth/me  -> the logged-in user with their plan (protected)
authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).populate('planId');
  if (!user) return res.status(401).json({ error: 'User no longer exists' });
  res.json(user);
});

export default authRouter;

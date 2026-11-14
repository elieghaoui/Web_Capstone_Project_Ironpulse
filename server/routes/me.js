import express from 'express';
import { User } from '../models/User.js';
import { Plan } from '../models/Plan.js';
import { validate, ChoosePlanInput } from '../middleware/validate.js';
import { cycleFor, countUsed } from '../utils/planCycle.js';

// /api/me/plan: the logged-in member's membership (requireAuth runs first, see app.js).
const meRouter = express.Router();

// GET /api/me/plan  -> my plan and how much of it I've used in this 30-day period
meRouter.get('/plan', async (req, res) => {
  const user = await User.findById(req.userId).populate('planId');
  if (!user) return res.status(401).json({ error: 'User no longer exists' });
  if (!user.planId) return res.json({ plan: null });

  const cycle = cycleFor(user.planStartedAt);
  const [classesUsed, ptUsed] = await Promise.all([
    countUsed(user._id, 'class', cycle),
    countUsed(user._id, 'pt', cycle),
  ]);
  res.json({ plan: user.planId, cycleStart: cycle.start, cycleEnd: cycle.end, classesUsed, ptUsed });
});

// PUT /api/me/plan { planId }  -> choose or switch plan; starts a new 30-day period
meRouter.put('/plan', validate(ChoosePlanInput), async (req, res) => {
  const plan = await Plan.findById(req.body.planId);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'User no longer exists' });
  if (user.planId?.equals(plan._id)) {
    return res.status(400).json({ error: `You're already on the ${plan.name} plan` });
  }
  user.planId = plan._id;
  user.planStartedAt = new Date();
  await user.save();
  res.json(await user.populate('planId'));
});

export default meRouter;

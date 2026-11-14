import express from 'express';
import { Plan } from '../models/Plan.js';
import { User } from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { validate, checkId, PlanInput, PlanUpdateInput } from '../middleware/validate.js';

// /api/plans: anyone can read; only admins create, update or delete.
const plansRouter = express.Router();
const adminOnly = [requireAuth, requireAdmin];

plansRouter.get('/', async (req, res) => {
  res.json(await Plan.find().sort({ order: 1 }));
});

plansRouter.get('/:id', checkId, async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  res.json(plan);
});

plansRouter.post('/', adminOnly, validate(PlanInput), async (req, res) => {
  res.status(201).json(await Plan.create(req.body)); // duplicate name -> 409 (error handler)
});

plansRouter.patch('/:id', adminOnly, checkId, validate(PlanUpdateInput), async (req, res) => {
  const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  res.json(plan);
});

plansRouter.delete('/:id', adminOnly, checkId, async (req, res) => {
  if (await User.exists({ planId: req.params.id })) {
    return res.status(409).json({ error: 'Members are on this plan: move them to another plan first' });
  }
  const plan = await Plan.findByIdAndDelete(req.params.id);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  res.sendStatus(204);
});

export default plansRouter;

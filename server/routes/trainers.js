import express from 'express';
import mongoose from 'mongoose';
import { Trainer } from '../models/Trainer.js';
import { GymClass } from '../models/GymClass.js';
import { Booking } from '../models/Booking.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { validate, validateQuery, checkId, TrainerInput, TrainerUpdateInput, SlotsQuery } from '../middleware/validate.js';
import { freeSlots } from '../utils/time.js';

// /api/trainers: anyone can read; only admins create, update or delete.
const trainersRouter = express.Router();
const adminOnly = [requireAuth, requireAdmin];

trainersRouter.get('/', async (req, res) => {
  res.json(await Trainer.find().sort({ name: 1 }));
});

trainersRouter.get('/:id', checkId, async (req, res) => {
  const trainer = await Trainer.findById(req.params.id);
  if (!trainer) return res.status(404).json({ error: 'Trainer not found' });
  res.json(trainer);
});

// GET /api/trainers/:id/slots?days=14  -> free 1-hour PT start times
trainersRouter.get('/:id/slots', checkId, validateQuery(SlotsQuery), async (req, res) => {
  const trainer = await Trainer.findById(req.params.id);
  if (!trainer) return res.status(404).json({ error: 'Trainer not found' });

  const { days } = req.validQuery;
  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const taken = await Booking.find({
    trainerId: trainer._id,
    type: 'pt',
    status: 'booked',
    // mongoose.trusted: our own operator, so sanitizeFilter (see app.js) keeps it
    startsAt: mongoose.trusted({ $gte: now, $lt: until }),
  }).select('startsAt');
  const takenTimes = new Set(taken.map((b) => b.startsAt.getTime()));
  res.json(freeSlots(trainer, takenTimes, days, now));
});

trainersRouter.post('/', adminOnly, validate(TrainerInput), async (req, res) => {
  res.status(201).json(await Trainer.create(req.body));
});

trainersRouter.patch('/:id', adminOnly, checkId, validate(TrainerUpdateInput), async (req, res) => {
  const trainer = await Trainer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!trainer) return res.status(404).json({ error: 'Trainer not found' });
  res.json(trainer);
});

trainersRouter.delete('/:id', adminOnly, checkId, async (req, res) => {
  const id = req.params.id;
  const busy =
    (await GymClass.exists({ trainerId: id })) ||
    (await Booking.exists({ trainerId: id, status: 'booked', startsAt: mongoose.trusted({ $gte: new Date() }) }));
  if (busy) {
    return res.status(409).json({ error: 'This trainer still has classes or PT sessions: remove or cancel those first' });
  }
  const trainer = await Trainer.findByIdAndDelete(id);
  if (!trainer) return res.status(404).json({ error: 'Trainer not found' });
  res.sendStatus(204);
});

export default trainersRouter;

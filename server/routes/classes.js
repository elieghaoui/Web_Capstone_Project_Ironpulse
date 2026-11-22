import express from 'express';
import mongoose from 'mongoose';
import { GymClass } from '../models/GymClass.js';
import { Trainer } from '../models/Trainer.js';
import { Booking } from '../models/Booking.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { validate, validateQuery, checkId, ClassInput, ClassUpdateInput, ClassesQuery, DeleteClassQuery } from '../middleware/validate.js';

// /api/classes: anyone can read the schedule; only admins create, update or delete.
const classesRouter = express.Router();
const adminOnly = [requireAuth, requireAdmin];

// Adds spotsLeft to each class: capacity minus the class's bookedCount counter.
function withSpotsLeft(classes) {
  return classes.map((c) => ({ ...c.toObject(), spotsLeft: c.capacity - (c.bookedCount ?? 0) }));
}

// GET /api/classes?category=Yoga  -> upcoming classes, soonest first
classesRouter.get('/', validateQuery(ClassesQuery), async (req, res) => {
  // mongoose.trusted: our own operator, so sanitizeFilter (see app.js) keeps it
  const filter = { startsAt: mongoose.trusted({ $gte: new Date() }) };
  if (req.validQuery.category) filter.category = req.validQuery.category;
  const classes = await GymClass.find(filter).sort({ startsAt: 1 }).populate('trainerId', 'name');
  res.json(withSpotsLeft(classes));
});

classesRouter.get('/:id', checkId, async (req, res) => {
  const gymClass = await GymClass.findById(req.params.id).populate('trainerId', 'name');
  if (!gymClass) return res.status(404).json({ error: 'Class not found' });
  res.json(withSpotsLeft([gymClass])[0]);
});

classesRouter.post('/', adminOnly, validate(ClassInput), async (req, res) => {
  if (!(await Trainer.exists({ _id: req.body.trainerId }))) {
    return res.status(400).json({ error: 'trainerId does not match any trainer' });
  }
  const { bookedCount, ...fields } = req.body; // the counter is never set by hand
  res.status(201).json(await GymClass.create(fields));
});

classesRouter.patch('/:id', adminOnly, checkId, validate(ClassUpdateInput), async (req, res) => {
  const id = req.params.id;
  if (req.body.trainerId && !(await Trainer.exists({ _id: req.body.trainerId }))) {
    return res.status(400).json({ error: 'trainerId does not match any trainer' });
  }
  const { bookedCount, ...changes } = req.body; // the counter is never set by hand
  // Lowering capacity: only if it stays >= the spots already taken, checked in the same atomic update.
  const filter = changes.capacity === undefined
    ? { _id: id }
    : { _id: id, bookedCount: mongoose.trusted({ $lte: changes.capacity }) };
  const gymClass = await GymClass.findOneAndUpdate(filter, changes, { new: true, runValidators: true });
  if (!gymClass) {
    const existing = await GymClass.findById(id);
    if (!existing) return res.status(404).json({ error: 'Class not found' });
    return res.status(409).json({ error: `${existing.bookedCount} members already booked this class: capacity can't go below that` });
  }

  // Bookings keep a copy of the start time, so move them with the class.
  if (req.body.startsAt) {
    await Booking.updateMany({ classId: id, status: 'booked' }, { startsAt: gymClass.startsAt });
  }
  res.json(gymClass);
});

// DELETE /api/classes/:id                       -> 204, or 409 if members booked it
// DELETE /api/classes/:id?cancelBookings=true    -> the gym cancels the class: every active
//   booking becomes "cancelled" (members get their credit back), then the class is removed.
classesRouter.delete('/:id', adminOnly, checkId, validateQuery(DeleteClassQuery), async (req, res) => {
  const active = { classId: req.params.id, status: 'booked' };
  if (req.validQuery.cancelBookings === 'true') {
    await Booking.updateMany(active, { status: 'cancelled' });
  } else if (await Booking.exists(active)) {
    return res.status(409).json({ error: 'Members booked this class: cancel their bookings first' });
  }
  const gymClass = await GymClass.findByIdAndDelete(req.params.id);
  if (!gymClass) return res.status(404).json({ error: 'Class not found' });
  res.sendStatus(204);
});

export default classesRouter;

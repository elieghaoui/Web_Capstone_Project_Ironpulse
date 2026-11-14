import express from 'express';
import mongoose from 'mongoose';
import { GymClass } from '../models/GymClass.js';
import { Trainer } from '../models/Trainer.js';
import { Booking } from '../models/Booking.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { validate, validateQuery, checkId, ClassInput, ClassUpdateInput, ClassesQuery } from '../middleware/validate.js';

// /api/classes: anyone can read the schedule; only admins create, update or delete.
const classesRouter = express.Router();
const adminOnly = [requireAuth, requireAdmin];

// Adds spotsLeft (capacity minus active bookings) to each class, in one query.
async function withSpotsLeft(classes) {
  const counts = await Booking.aggregate([
    { $match: { type: 'class', status: 'booked', classId: { $in: classes.map((c) => c._id) } } },
    { $group: { _id: '$classId', count: { $sum: 1 } } },
  ]);
  const booked = new Map(counts.map((c) => [c._id.toString(), c.count]));
  return classes.map((c) => ({ ...c.toObject(), spotsLeft: c.capacity - (booked.get(c._id.toString()) ?? 0) }));
}

// GET /api/classes?category=Yoga  -> upcoming classes, soonest first
classesRouter.get('/', validateQuery(ClassesQuery), async (req, res) => {
  // mongoose.trusted: our own operator, so sanitizeFilter (see app.js) keeps it
  const filter = { startsAt: mongoose.trusted({ $gte: new Date() }) };
  if (req.validQuery.category) filter.category = req.validQuery.category;
  const classes = await GymClass.find(filter).sort({ startsAt: 1 }).populate('trainerId', 'name');
  res.json(await withSpotsLeft(classes));
});

classesRouter.get('/:id', checkId, async (req, res) => {
  const gymClass = await GymClass.findById(req.params.id).populate('trainerId', 'name');
  if (!gymClass) return res.status(404).json({ error: 'Class not found' });
  res.json((await withSpotsLeft([gymClass]))[0]);
});

classesRouter.post('/', adminOnly, validate(ClassInput), async (req, res) => {
  if (!(await Trainer.exists({ _id: req.body.trainerId }))) {
    return res.status(400).json({ error: 'trainerId does not match any trainer' });
  }
  res.status(201).json(await GymClass.create(req.body));
});

classesRouter.patch('/:id', adminOnly, checkId, validate(ClassUpdateInput), async (req, res) => {
  const id = req.params.id;
  if (req.body.trainerId && !(await Trainer.exists({ _id: req.body.trainerId }))) {
    return res.status(400).json({ error: 'trainerId does not match any trainer' });
  }
  if (req.body.capacity !== undefined) {
    const booked = await Booking.countDocuments({ classId: id, status: 'booked' });
    if (req.body.capacity < booked) {
      return res.status(409).json({ error: `${booked} members already booked this class: capacity can't go below that` });
    }
  }
  const gymClass = await GymClass.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!gymClass) return res.status(404).json({ error: 'Class not found' });

  // Bookings keep a copy of the start time, so move them with the class.
  if (req.body.startsAt) {
    await Booking.updateMany({ classId: id, status: 'booked' }, { startsAt: gymClass.startsAt });
  }
  res.json(gymClass);
});

classesRouter.delete('/:id', adminOnly, checkId, async (req, res) => {
  if (await Booking.exists({ classId: req.params.id, status: 'booked' })) {
    return res.status(409).json({ error: 'Members booked this class: cancel their bookings first' });
  }
  const gymClass = await GymClass.findByIdAndDelete(req.params.id);
  if (!gymClass) return res.status(404).json({ error: 'Class not found' });
  res.sendStatus(204);
});

export default classesRouter;

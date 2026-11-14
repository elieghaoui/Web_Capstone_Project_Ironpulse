import express from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { GymClass } from '../models/GymClass.js';
import { Trainer } from '../models/Trainer.js';
import { Booking } from '../models/Booking.js';
import { validate, validateQuery, checkId, BookingInput, BookingUpdateInput, BookingsQuery } from '../middleware/validate.js';
import { checkPlanAllows } from '../utils/planCycle.js';
import { isTrainerAvailable } from '../utils/time.js';

// Bookings are our main resource. requireAuth runs first (see app.js), and every
// member query includes { userId: req.userId }: a member can only see, edit or
// cancel their own bookings. Someone else's id gets 404, as if it didn't exist.
const bookingsRouter = express.Router();

export const CANCEL_LIMIT_HOURS = 12;
const HOUR = 60 * 60 * 1000;

function withDetails(query) {
  return query
    .populate({ path: 'classId', select: 'title category room durationMin', populate: { path: 'trainerId', select: 'name' } })
    .populate('trainerId', 'name');
}

// GET /api/bookings
//   member: my upcoming active bookings, soonest first
//   admin:  every booking, optional ?status=booked|cancelled&type=class|pt
bookingsRouter.get('/', validateQuery(BookingsQuery), async (req, res) => {
  if (req.userRole === 'admin') {
    const bookings = await withDetails(Booking.find(req.validQuery))
      .populate('userId', 'name email')
      .sort({ startsAt: 1 })
      .limit(500);
    return res.json(bookings);
  }
  const filter = { userId: req.userId, status: 'booked', startsAt: mongoose.trusted({ $gte: new Date() }) };
  res.json(await withDetails(Booking.find(filter)).sort({ startsAt: 1 }));
});

// POST /api/bookings  -> 201
// { "type": "class", "classId": "..." }  or  { "type": "pt", "trainerId": "...", "startsAt": "2026-11-20T09:00:00+02:00" }
bookingsRouter.post('/', validate(BookingInput), async (req, res) => {
  const user = await User.findById(req.userId).populate('planId');
  if (!user) return res.status(401).json({ error: 'User no longer exists' });
  const { type, note = '' } = req.body;
  const now = new Date();

  if (type === 'class') {
    const gymClass = await GymClass.findById(req.body.classId);
    if (!gymClass) return res.status(404).json({ error: 'Class not found' });
    if (gymClass.startsAt <= now) return res.status(400).json({ error: 'This class has already started' });

    const planProblem = await checkPlanAllows(user, 'class', gymClass.startsAt);
    if (planProblem) return res.status(planProblem.status).json({ error: planProblem.error });

    if (await Booking.exists({ userId: user._id, classId: gymClass._id, status: 'booked' })) {
      return res.status(409).json({ error: 'You already booked this class' });
    }
    const taken = await Booking.countDocuments({ classId: gymClass._id, status: 'booked' });
    if (taken >= gymClass.capacity) return res.status(409).json({ error: 'This class is full' });

    // The owner comes from the token, never from the request body.
    const booking = await Booking.create({ userId: user._id, type, classId: gymClass._id, startsAt: gymClass.startsAt, note });
    return res.status(201).json(await withDetails(Booking.findById(booking._id)));
  }

  // type === 'pt': a 1-hour session with a trainer
  const trainer = await Trainer.findById(req.body.trainerId);
  if (!trainer) return res.status(404).json({ error: 'Trainer not found' });
  const { startsAt } = req.body;
  if (startsAt <= now) return res.status(400).json({ error: 'Pick a time in the future' });
  if (!isTrainerAvailable(trainer, startsAt)) {
    return res.status(400).json({ error: `${trainer.name} isn't available at that time (sessions start on the hour)` });
  }

  const planProblem = await checkPlanAllows(user, 'pt', startsAt);
  if (planProblem) return res.status(planProblem.status).json({ error: planProblem.error });

  if (await Booking.exists({ trainerId: trainer._id, type: 'pt', status: 'booked', startsAt })) {
    return res.status(409).json({ error: 'That time slot is already taken' });
  }
  const booking = await Booking.create({ userId: user._id, type, trainerId: trainer._id, startsAt, note });
  res.status(201).json(await withDetails(Booking.findById(booking._id)));
});

// GET /api/bookings/:id  -> one of MY bookings
bookingsRouter.get('/:id', checkId, async (req, res) => {
  const booking = await withDetails(Booking.findOne({ _id: req.params.id, userId: req.userId }));
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(booking);
});

// PATCH /api/bookings/:id { note }  -> change the note on one of MY active bookings
bookingsRouter.patch('/:id', checkId, validate(BookingUpdateInput), async (req, res) => {
  const filter = { _id: req.params.id, userId: req.userId, status: 'booked' };
  const booking = await withDetails(
    Booking.findOneAndUpdate(filter, { note: req.body.note }, { new: true, runValidators: true })
  );
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(booking);
});

// DELETE /api/bookings/:id  -> cancel one of MY bookings, up to 12 hours before -> 204.
// The booking is kept as "cancelled" (history isn't lost) and stops counting
// toward the plan's limit, so the credit comes back.
bookingsRouter.delete('/:id', checkId, async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, userId: req.userId });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status === 'cancelled') return res.status(400).json({ error: 'This booking is already cancelled' });
  if (booking.startsAt.getTime() - Date.now() < CANCEL_LIMIT_HOURS * HOUR) {
    return res.status(400).json({ error: `Too late to cancel: bookings can be cancelled up to ${CANCEL_LIMIT_HOURS} hours before they start` });
  }
  booking.status = 'cancelled';
  await booking.save();
  res.sendStatus(204);
});

export default bookingsRouter;

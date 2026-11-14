import express from 'express';
import { Plan } from '../models/Plan.js';
import { Trainer } from '../models/Trainer.js';
import { GymClass } from '../models/GymClass.js';
import { Booking } from '../models/Booking.js';

// Read-only routes anyone can call (no login needed).
const router = express.Router();

router.get('/plans', async (req, res, next) => {
  try {
    res.json(await Plan.find().sort({ order: 1 }));
  } catch (err) {
    next(err);
  }
});

router.get('/trainers', async (req, res, next) => {
  try {
    res.json(await Trainer.find().sort({ name: 1 }));
  } catch (err) {
    next(err);
  }
});

router.get('/trainers/:id', async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) return res.status(404).json({ error: 'Trainer not found' });
    res.json(trainer);
  } catch (err) {
    next(err);
  }
});

// GET /api/classes?category=Yoga  -> upcoming classes with spotsLeft
router.get('/classes', async (req, res, next) => {
  try {
    const filter = { startsAt: { $gte: new Date() } };
    if (typeof req.query.category === 'string' && req.query.category) {
      filter.category = req.query.category;
    }
    const classes = await GymClass.find(filter).sort({ startsAt: 1 }).populate('trainer', 'name');

    // Count active bookings per class in one query.
    const counts = await Booking.aggregate([
      { $match: { type: 'class', status: 'booked', gymClass: { $in: classes.map((c) => c._id) } } },
      { $group: { _id: '$gymClass', count: { $sum: 1 } } },
    ]);
    const booked = new Map(counts.map((c) => [c._id.toString(), c.count]));

    res.json(
      classes.map((c) => ({
        ...c.toObject(),
        spotsLeft: c.capacity - (booked.get(c._id.toString()) ?? 0),
      }))
    );
  } catch (err) {
    next(err);
  }
});

export default router;

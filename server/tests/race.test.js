import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../app.js';
import { Plan } from '../models/Plan.js';
import { Trainer } from '../models/Trainer.js';
import { GymClass } from '../models/GymClass.js';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';

// Two members click "Book" on the LAST spot at the same moment.
// This one needs a real database, so it only runs when TEST_MONGODB_URI is set
// (use a separate database, e.g. .../ironpulse-test). Without it, it is skipped (CI too).
//   PowerShell: $env:TEST_MONGODB_URI="mongodb+srv://.../ironpulse-test"; npm test
const uri = process.env.TEST_MONGODB_URI;
process.env.JWT_SECRET ??= 'test-secret';

describe.skipIf(!uri)('booking the last spot (needs TEST_MONGODB_URI)', () => {
  let plan, trainer, gymClass, alice, bob;

  beforeAll(async () => {
    await mongoose.connect(uri);
    const tag = Date.now();
    plan = await Plan.create({ name: `Race test ${tag}`, priceMonthly: 1, classesPerMonth: null });
    trainer = await Trainer.create({ name: `Race coach ${tag}` });
    gymClass = await GymClass.create({
      title: 'Last spot test', category: 'HIIT', trainerId: trainer._id,
      startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), durationMin: 45, capacity: 1,
    });
    const member = (name) => ({ name, email: `${name}.${tag}@race.test`, passwordHash: 'x', planId: plan._id, planStartedAt: new Date() });
    [alice, bob] = await User.create([member('alice'), member('bob')]);
  });

  afterAll(async () => {
    await Booking.deleteMany({ classId: gymClass?._id });
    await GymClass.deleteMany({ _id: gymClass?._id });
    await User.deleteMany({ _id: { $in: [alice?._id, bob?._id] } });
    await Trainer.deleteMany({ _id: trainer?._id });
    await Plan.deleteMany({ _id: plan?._id });
    await mongoose.disconnect();
  });

  it('gives the last spot to exactly one of two simultaneous requests', async () => {
    const book = (user) =>
      request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${jwt.sign({ sub: user._id.toString(), role: 'member' }, process.env.JWT_SECRET)}`)
        .send({ type: 'class', classId: gymClass._id.toString() });

    const results = await Promise.all([book(alice), book(bob)]); // both at once
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(results.find((r) => r.status === 409).body.error).toBe('This class is full');

    expect(await Booking.countDocuments({ classId: gymClass._id, status: 'booked' })).toBe(1);
    expect((await GymClass.findById(gymClass._id)).bookedCount).toBe(1);
  });
});

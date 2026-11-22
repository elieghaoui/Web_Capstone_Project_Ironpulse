import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { gymTimeZone } from './time.js';

const DAY = 24 * 60 * 60 * 1000;
export const CYCLE_DAYS = 30;

// Plans renew every 30 days from the day the member chose them.
// Returns the 30-day period that contains `date`.
export function cycleFor(planStartedAt, date = new Date()) {
  const start = planStartedAt.getTime();
  const length = CYCLE_DAYS * DAY;
  const index = Math.max(0, Math.floor((date.getTime() - start) / length));
  const cycleStart = start + index * length;
  return { start: new Date(cycleStart), end: new Date(cycleStart + length) };
}

// How many active bookings of this type the member has in that period.
// Cancelled bookings don't count, so cancelling gives the credit back.
export function countUsed(userId, type, cycle) {
  return Booking.countDocuments({
    userId,
    type,
    status: 'booked',
    startsAt: mongoose.trusted({ $gte: cycle.start, $lt: cycle.end }),
  });
}

// Checks the member's plan allows one more booking of `type` at `startsAt`.
// Returns null when allowed, or { status, error } to send back.
export async function checkPlanAllows(user, type, startsAt) {
  const plan = user.planId; // populated
  if (!plan) return { status: 403, error: 'Choose a membership plan before booking' };

  const limit = type === 'class' ? plan.classesPerMonth : plan.ptSessionsPerMonth;
  const what = type === 'class' ? 'group classes' : 'PT sessions';
  if (limit === 0) return { status: 403, error: `Your ${plan.name} plan doesn't include ${what}` };
  if (limit === null || limit === undefined) return null; // unlimited

  const cycle = cycleFor(user.planStartedAt, startsAt);
  const used = await countUsed(user._id, type, cycle);
  if (used >= limit) {
    // e.g. "22 Dec", in the gym's time zone
    const renews = cycle.end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: gymTimeZone() });
    const one = type === 'class' ? 'group class' : 'PT session';
    const error = limit === 1
      ? `You've used the 1 ${one} of your ${plan.name} plan. It renews on ${renews}.`
      : `You've used all ${limit} ${what} of your ${plan.name} plan. They renew on ${renews}.`;
    return { status: 403, error };
  }
  return null;
}

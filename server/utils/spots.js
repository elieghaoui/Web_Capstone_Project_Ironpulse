import mongoose from 'mongoose';

// Filter for "this class still has a free spot", used in ONE atomic update:
//   GymClass.findOneAndUpdate(hasRoom(gymClass), { $inc: { bookedCount: 1 } })
// "$not $gte" = bookedCount is below capacity (or not set yet on an old class).
// It is a condition on a field wrapped in mongoose.trusted, so sanitizeFilter
// keeps it. Top-level operators like $expr are refused by sanitizeFilter.
export function hasRoom(gymClass) {
  return { _id: gymClass._id, bookedCount: mongoose.trusted({ $not: { $gte: gymClass.capacity } }) };
}

import mongoose from 'mongoose';

export const CATEGORIES = ['HIIT', 'Cycling', 'Yoga', 'Pilates', 'Boxing', 'Strength', 'Mobility'];

// One scheduled class session, e.g. "HIIT Burn, Monday 18:00".
const gymClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
    },
    room: { type: String, default: 'Studio A' },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
    startsAt: { type: Date, required: true },
    durationMin: { type: Number, required: true, min: 15, max: 180 },
    capacity: { type: Number, required: true, min: 1 },
    // Active bookings. Only changed with atomic $inc updates (see routes/bookings.js),
    // so two members can never both take the last spot.
    bookedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Indexes (lecture 22): GET /api/classes filters by category and sorts by startsAt.
gymClassSchema.index({ startsAt: 1 });
gymClassSchema.index({ category: 1, startsAt: 1 });

export const GymClass = mongoose.model('GymClass', gymClassSchema);

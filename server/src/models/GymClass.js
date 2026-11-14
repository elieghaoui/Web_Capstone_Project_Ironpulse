import mongoose from 'mongoose';

// One scheduled class session, e.g. "HIIT Burn, Monday 18:00".
const gymClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['HIIT', 'Cycling', 'Yoga', 'Pilates', 'Boxing', 'Strength', 'Mobility'],
      required: true,
    },
    room: { type: String, default: 'Studio A' },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
    startsAt: { type: Date, required: true },
    durationMin: { type: Number, required: true, min: 15, max: 180 },
    capacity: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

export const GymClass = mongoose.model('GymClass', gymClassSchema);

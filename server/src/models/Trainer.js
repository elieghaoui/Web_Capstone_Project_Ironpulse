import mongoose from 'mongoose';

// One weekly time window when the trainer takes PT sessions.
const availabilitySchema = new mongoose.Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    start: { type: String, required: true, match: /^\d{2}:\d{2}$/ }, // "09:00"
    end: { type: String, required: true, match: /^\d{2}:\d{2}$/ }, // "13:00"
  },
  { _id: false }
);

const trainerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    photoUrl: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 1000 },
    specialties: { type: [String], default: [] },
    yearsExperience: { type: Number, default: 0, min: 0 },
    weeklyAvailability: { type: [availabilitySchema], default: [] },
  },
  { timestamps: true }
);

export const Trainer = mongoose.model('Trainer', trainerSchema);

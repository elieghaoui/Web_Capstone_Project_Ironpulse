import mongoose from 'mongoose';

// A booking is either a spot in a class (type "class")
// or a 1-hour session with a trainer (type "pt").
const bookingSchema = new mongoose.Schema(
  {
    // The owner. Always set from the token (req.userId), never from the request body.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['class', 'pt'], required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'GymClass' }, // when type = class
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' }, // when type = pt
    startsAt: { type: Date, required: true },
    status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' },
    note: { type: String, default: '', maxlength: 300 }, // e.g. "knee injury, go easy"
  },
  { timestamps: true }
);

// A member can hold only one active booking for the same class.
bookingSchema.index(
  { userId: 1, classId: 1 },
  { unique: true, partialFilterExpression: { type: 'class', status: 'booked' } }
);

// A trainer can't have two active PT sessions at the same time.
bookingSchema.index(
  { trainerId: 1, startsAt: 1 },
  { unique: true, partialFilterExpression: { type: 'pt', status: 'booked' } }
);

export const Booking = mongoose.model('Booking', bookingSchema);

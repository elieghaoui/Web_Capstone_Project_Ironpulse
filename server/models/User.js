import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    // Never store the real password: only the bcrypt hash.
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['member', 'admin'], default: 'member' },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
    planStartedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Whenever a user is sent as JSON, remove the hash.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);

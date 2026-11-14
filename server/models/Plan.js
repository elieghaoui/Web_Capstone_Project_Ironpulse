import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    priceMonthly: { type: Number, required: true, min: 0 },
    // null means unlimited
    classesPerMonth: { type: Number, default: 0, min: 0 },
    ptSessionsPerMonth: { type: Number, default: 0, min: 0 },
    perks: { type: [String], default: [] },
    order: { type: Number, default: 0 }, // display order on the Plans page
  },
  { timestamps: true }
);

export const Plan = mongoose.model('Plan', planSchema);

import mongoose from 'mongoose';
import { z } from 'zod';
import { CATEGORIES } from '../models/GymClass.js';

// Validate at the door (lecture 21): wrong type or shape -> 400 before
// MongoDB ever sees it. Only the declared fields survive; unknown keys
// such as "role" or "userId" are dropped (no mass assignment).
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }
  req.body = result.data;
  next();
};

// Same idea for the query string (?category=Yoga). Unknown parameters -> 400.
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }
  req.validQuery = result.data; // Express 5: req.query itself can't be replaced
  next();
};

// Lecture 18: a malformed id is a bad request (400), a valid id that doesn't exist is 404.
export function checkId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  next();
}

// ---------- What valid looks like ----------
const objectId = z
  .string({ message: 'Id is required' })
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid id');
const isoDate = z
  .iso.datetime({ offset: true, message: 'Use a date like 2026-11-20T09:00:00+02:00' })
  .transform((value) => new Date(value));
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a time like 09:00');
const note = z.string().trim().max(300, 'Note is too long (300 characters max)');
const atLeastOne = (obj) => Object.keys(obj).length > 0;

// Accounts. .trim() and .toLowerCase() sanitize while checking.
export const SignupInput = z.object({
  name: z.string({ message: 'Name is required' }).trim().min(1, 'Name is required').max(80, 'Name is too long'),
  email: z
    .string({ message: 'Email is required' })
    .trim()
    .toLowerCase()
    .max(254, 'Email is too long')
    .email('Enter a valid email'),
  // bcrypt only uses the first 72 bytes of a password
  password: z
    .string({ message: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});

export const LoginInput = z.object({
  email: z.string({ message: 'Email is required' }).trim().toLowerCase().max(254),
  password: z.string({ message: 'Password is required' }).min(1, 'Password is required').max(200),
});

// Member: plan and bookings
export const ChoosePlanInput = z.object({ planId: objectId });

// A booking is either a class spot or a 1-hour PT session.
export const BookingInput = z.discriminatedUnion(
  'type',
  [
    z.object({ type: z.literal('class'), classId: objectId, note: note.optional() }),
    z.object({ type: z.literal('pt'), trainerId: objectId, startsAt: isoDate, note: note.optional() }),
  ],
  { message: 'type must be "class" or "pt"' }
);

// The only thing a member can change on a booking is its note.
export const BookingUpdateInput = z.object({ note });

// Admin: plans, trainers, classes. PATCH schemas are the same, every field optional.
export const PlanInput = z.object({
  name: z.string({ message: 'Name is required' }).trim().min(1, 'Name is required').max(40),
  priceMonthly: z.number({ message: 'priceMonthly must be a number' }).min(0).max(10000),
  classesPerMonth: z.number().int().min(0).max(1000).nullable(), // null = unlimited
  ptSessionsPerMonth: z.number().int().min(0).max(100),
  perks: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
  order: z.number().int().min(0).max(100).optional(),
});
export const PlanUpdateInput = PlanInput.partial().refine(atLeastOne, 'Nothing to update');

const availability = z
  .object({ day: z.number().int().min(0).max(6), start: time, end: time })
  .refine((slot) => slot.start < slot.end, 'start must be before end');

export const TrainerInput = z.object({
  name: z.string({ message: 'Name is required' }).trim().min(1, 'Name is required').max(80),
  photoUrl: z.string().trim().max(500).optional(),
  bio: z.string().trim().max(1000).optional(),
  specialties: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  yearsExperience: z.number().int().min(0).max(60).optional(),
  weeklyAvailability: z.array(availability).max(21).optional(),
});
export const TrainerUpdateInput = TrainerInput.partial().refine(atLeastOne, 'Nothing to update');

export const ClassInput = z.object({
  title: z.string({ message: 'Title is required' }).trim().min(1, 'Title is required').max(80),
  category: z.enum(CATEGORIES, { message: `category must be one of: ${CATEGORIES.join(', ')}` }),
  room: z.string().trim().min(1).max(40).optional(),
  trainerId: objectId,
  startsAt: isoDate,
  durationMin: z.number().int().min(15).max(180),
  capacity: z.number().int().min(1).max(200),
});
export const ClassUpdateInput = ClassInput.partial().refine(atLeastOne, 'Nothing to update');

// Query strings (every value arrives as a string)
export const ClassesQuery = z
  .object({ category: z.enum(CATEGORIES, { message: 'Unknown class category' }).optional() })
  .strict({ message: 'Unknown query parameter' });
export const SlotsQuery = z
  .object({ days: z.coerce.number().int().min(1).max(28).default(14) })
  .strict({ message: 'Unknown query parameter' });
export const BookingsQuery = z
  .object({ status: z.enum(['booked', 'cancelled']).optional(), type: z.enum(['class', 'pt']).optional() })
  .strict({ message: 'Unknown query parameter' });

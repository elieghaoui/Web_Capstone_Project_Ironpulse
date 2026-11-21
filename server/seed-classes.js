// Adds the timetable's classes for the next few weeks WITHOUT deleting anything:
// members, bookings, plans and trainers stay. Classes that already exist
// (same title and start time) are skipped, so it is safe to run again.
// Run with: npm run seed:classes        (4 weeks)
//       or: npm run seed:classes -- 6   (6 weeks)
import 'dotenv/config';
import mongoose from 'mongoose';
import { checkEnv } from './config.js';
import { Trainer } from './models/Trainer.js';
import { GymClass } from './models/GymClass.js';
import { buildClasses } from './timetable.js';

async function seedClasses() {
  checkEnv(['MONGODB_URI']);
  const weeks = Number(process.argv[2]) || 4;
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('connected to MongoDB');

  const trainers = await Trainer.find();
  const trainerIds = Object.fromEntries(trainers.map((t) => [t.name, t._id]));

  const now = new Date();
  const wanted = buildClasses(trainerIds, weeks).filter((c) => c.startsAt > now && c.trainerId);
  const existing = await GymClass.find({ startsAt: mongoose.trusted({ $gte: now }) }).select('title startsAt');
  const taken = new Set(existing.map((c) => `${c.title}|${c.startsAt.getTime()}`));
  const missing = wanted.filter((c) => !taken.has(`${c.title}|${c.startsAt.getTime()}`));

  await GymClass.insertMany(missing);
  console.log(`Added ${missing.length} classes for the next ${weeks} weeks (${wanted.length - missing.length} already there)`);
  await mongoose.disconnect();
}

seedClasses().catch((err) => {
  console.error('seed:classes failed:', err.message);
  process.exit(1);
});

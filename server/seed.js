// Fills the database with IRONPULSE's plans, trainers, two weeks of classes
// and one admin account. Run with: npm run seed
// It first wipes plans, trainers, classes, bookings AND member accounts
// (the admin is kept), so every demo or Thunder Client run starts clean.
// To only add more upcoming classes without deleting anyone: npm run seed:classes
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { checkEnv } from './config.js';
import { Plan } from './models/Plan.js';
import { Trainer } from './models/Trainer.js';
import { GymClass } from './models/GymClass.js';
import { Booking } from './models/Booking.js';
import { User } from './models/User.js';
import { buildClasses } from './timetable.js';

const plans = [
  { order: 1, name: 'Basic', priceMonthly: 50, classesPerMonth: 0, ptSessionsPerMonth: 0,
    perks: ['Gym floor access, 6am–10pm'] },
  { order: 2, name: 'Pro', priceMonthly: 85, classesPerMonth: 12, ptSessionsPerMonth: 1,
    perks: ['24/7 access', 'Locker'] },
  { order: 3, name: 'Elite', priceMonthly: 140, classesPerMonth: null, ptSessionsPerMonth: 4,
    perks: ['Everything in Pro', 'Monthly body scan', '2 guest passes'] },
  { order: 4, name: 'Transform', priceMonthly: 250, classesPerMonth: null, ptSessionsPerMonth: 12,
    perks: ['Everything in Elite', 'Personal nutrition plan'] },
  { order: 5, name: 'Athlete', priceMonthly: 400, classesPerMonth: null, ptSessionsPerMonth: 20,
    perks: ['Everything in Transform', 'Priority class booking', 'Recovery zone (sauna)', 'Towel service'] },
];

const trainers = [
  { name: 'Karim Haddad', specialties: ['Strength', 'Powerlifting'], yearsExperience: 9,
    bio: 'Former national-level powerlifter. Karim builds programs around the big three lifts and clean technique.',
    weeklyAvailability: [{ day: 1, start: '07:00', end: '11:00' }, { day: 3, start: '07:00', end: '11:00' }, { day: 5, start: '15:00', end: '19:00' }] },
  { name: 'Maya Khoury', specialties: ['Yoga', 'Pilates', 'Mobility'], yearsExperience: 7,
    bio: 'Certified yoga and Pilates instructor focused on posture, flexibility and injury prevention.',
    weeklyAvailability: [{ day: 0, start: '09:00', end: '13:00' }, { day: 2, start: '09:00', end: '13:00' }, { day: 4, start: '09:00', end: '13:00' }] },
  { name: 'Rami Nassar', specialties: ['Boxing', 'Conditioning'], yearsExperience: 10,
    bio: 'Amateur boxing champion turned coach. Expect footwork, pad work and serious cardio.',
    weeklyAvailability: [{ day: 1, start: '16:00', end: '20:00' }, { day: 3, start: '16:00', end: '20:00' }, { day: 6, start: '10:00', end: '14:00' }] },
  { name: 'Lea Saad', specialties: ['HIIT', 'Fat loss', 'Cycling'], yearsExperience: 5,
    bio: 'High-energy coach who mixes intervals and cycling to help members lose fat and build stamina.',
    weeklyAvailability: [{ day: 0, start: '17:00', end: '21:00' }, { day: 2, start: '17:00', end: '21:00' }, { day: 4, start: '17:00', end: '21:00' }] },
];

async function seed() {
  checkEnv(['MONGODB_URI']);
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('connected to MongoDB');

  await Promise.all([
    Plan.deleteMany(),
    Trainer.deleteMany(),
    GymClass.deleteMany(),
    Booking.deleteMany(),
    User.deleteMany({ role: 'member' }),
  ]);
  // Make the database's indexes match the models (drops ones left from old field names).
  await Promise.all([Plan, Trainer, GymClass, Booking, User].map((model) => model.syncIndexes()));

  await Plan.insertMany(plans);
  const savedTrainers = await Trainer.insertMany(trainers);
  const trainerIds = Object.fromEntries(savedTrainers.map((t) => [t.name, t._id]));
  const classes = await GymClass.insertMany(buildClasses(trainerIds));

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ironpulse.test').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword && adminPassword.length >= 8) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await User.findOneAndUpdate(
      { email: adminEmail },
      { name: 'Gym Admin', email: adminEmail, passwordHash, role: 'admin' },
      { upsert: true }
    );
    console.log(`Admin account ready: ${adminEmail}`);
  } else {
    console.log('No admin created: set ADMIN_PASSWORD (8+ characters) in .env');
  }

  console.log(`Seeded ${plans.length} plans, ${savedTrainers.length} trainers, ${classes.length} classes (member accounts removed)`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

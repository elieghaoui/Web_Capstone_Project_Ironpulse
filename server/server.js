import 'dotenv/config'; // first line: loads .env before anything reads it
import mongoose from 'mongoose';
import app from './app.js';
import { checkEnv } from './config.js';

const port = Number(process.env.PORT) || 3000; // the host sets PORT when deployed

// Connect first, then listen (lecture 18).
try {
  checkEnv(); // crash now if MONGODB_URI or JWT_SECRET is missing
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('connected to MongoDB');
  app.listen(port, () => console.log(`API on port ${port}`));
} catch (err) {
  console.error('Could not start the server:', err.message);
  process.exit(1);
}

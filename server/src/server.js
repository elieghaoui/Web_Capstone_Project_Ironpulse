import 'dotenv/config'; // first line: loads .env before anything reads it
import { createApp } from './app.js';
import { connectDB } from './config/db.js';

const port = Number(process.env.PORT) || 3000;

try {
  await connectDB(process.env.MONGODB_URI);
  createApp().listen(port, () => console.log(`API running on http://localhost:${port}`));
} catch (err) {
  console.error('Could not start the server:', err.message);
  process.exit(1);
}

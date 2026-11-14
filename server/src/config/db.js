import mongoose from 'mongoose';

export async function connectDB(uri) {
  if (!uri) {
    throw new Error('MONGODB_URI is missing. Copy .env.example to .env and fill it in.');
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

import mongoose from 'mongoose';

const MONGODB_URI = (
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.DATABASE_URL
) as string;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'sparesx';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI (or MONGO_URI) environment variable');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      dbName: MONGODB_DB_NAME,
    }).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

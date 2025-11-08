import mongoose from 'mongoose';

let connectionPromise: Promise<typeof mongoose> | null = null;

export function getMessagingMongoUri(): string {
  return process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/sparesx';
}

export function connectMessagingDatabase(): Promise<typeof mongoose> {
  if (!connectionPromise) {
    const uri = getMessagingMongoUri();
    connectionPromise = mongoose.connect(uri, {
      dbName: process.env.MONGO_DB || undefined,
    });

    mongoose.connection.on('error', (error) => {
      console.error('[messaging] Mongo connection error', error);
    });
  }

  return connectionPromise;
}

export async function disconnectMessagingDatabase(): Promise<void> {
  if (connectionPromise) {
    await mongoose.disconnect();
    connectionPromise = null;
  }
}

export type MessagingConnection = typeof mongoose;

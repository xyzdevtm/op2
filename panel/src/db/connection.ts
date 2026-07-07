import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/openfront';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`[Panel] Connected to MongoDB: ${MONGODB_URI}`);
  } catch (error) {
    console.error('[Panel] MongoDB connection failed:', error);
    process.exit(1);
  }
}

mongoose.connection.on('error', (err) => {
  console.error('[Panel] MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[Panel] MongoDB disconnected');
});

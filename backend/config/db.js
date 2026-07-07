import mongoose from 'mongoose';

export let isDBConnected = false;

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pr_dashboard';
    // Connect with a short timeout so we fallback quickly if MongoDB is offline
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    isDBConnected = true;
  } catch (error) {
    console.warn(`\nMongoDB Connection Failed: ${error.message}`);
    console.warn('>>> RUNNING IN LOCAL MEMORY BACKEND MODE <<<');
    console.warn('The server will operate fully but data will reset on restart.\n');
    isDBConnected = false;
  }
};

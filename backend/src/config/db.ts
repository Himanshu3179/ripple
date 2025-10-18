import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  try {
    const connection = await mongoose.connect(uri, {
      autoIndex: true,
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    throw error;
  }
};

export default connectDB;

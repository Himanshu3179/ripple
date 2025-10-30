import 'dotenv/config';
import connectDB from './config/db';
import { publishDueScheduledPosts } from './services/scheduledPostService';
import app from './app';

const PORT = Number(process.env.PORT) || 4000;

const startServer = async () => {
  try {
    await connectDB();
    setInterval(() => {
      publishDueScheduledPosts().catch((error) => {
        console.error('Failed to publish scheduled posts', error);
      });
    }, 60_000);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

void startServer();

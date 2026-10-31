import app from './app.js';
import env from './config/env.js';
import { connectDB, disconnectDB } from './db/connection.js';
import notificationWorker from './modules/notifications/notification.worker.js';

let server;

async function bootstrap() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start HTTP server
    server = app.listen(env.PORT, () => {
      console.log(`🚀  Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    });

    // 3. Start Background Notification Worker (outbox polling)
    notificationWorker.start();

    // Graceful Shutdown Handler
    const handleShutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Gracefully shutting down...`);
      notificationWorker.stop();

      if (server) {
        server.close(async () => {
          console.log('HTTP server closed.');
          await disconnectDB();
          console.log('MongoDB connection closed.');
          process.exit(0);
        });
      } else {
        await disconnectDB();
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (err) {
    console.error('❌  Bootstrap error:', err);
    process.exit(1);
  }
}

bootstrap();


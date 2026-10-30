import mongoose from 'mongoose';
import env from '../config/env.js';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      // mongoose 8.x uses new connection pool by default
    });

    isConnected = true;
    console.log(`✅  MongoDB connected: ${conn.connection.host} (${conn.connection.name})`);

    // Warn if not a replica set (transactions will fail)
    const adminDb = conn.connection.db.admin();
    try {
      const status = await adminDb.command({ isMaster: 1 });
      if (!status.setName) {
        console.warn(
          '⚠️   MongoDB is NOT running as a replica set. Transactions are disabled.\n' +
          '    Run: docker-compose up -d  (see docker-compose.yml)'
        );
      } else {
        console.log(`✅  Replica set detected: ${status.setName}`);
      }
    } catch {
      // Non-fatal — continue
    }
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

export async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}

export default mongoose;


import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import env from '../config/env.js';

let replSet = null;

export async function setupTestDB() {
  if (mongoose.connection.readyState !== 0) {
    return;
  }

  // 1. Try connecting to configured MONGODB_URI (Atlas) with a 3-second timeout
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('✅  Connected to MongoDB Atlas for tests.');
    return;
  } catch (err) {
    console.warn('⚠️   Could not reach MongoDB Atlas (IP not whitelisted or offline).');
    console.log('🔄  Starting in-memory MongoDB replica set for automated tests...');
  }

  // 2. Fall back to MongoMemoryReplSet (supports transactions out of the box)
  try {
    replSet = await MongoMemoryReplSet.create({
      instanceOpts: [{ launchTimeout: 60000 }],
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    const uri = replSet.getUri();
    await mongoose.connect(uri);
    console.log('✅  Connected to in-memory MongoDB replica set.');
  } catch (memErr) {
    console.error('Failed to start in-memory MongoDB:', memErr.message);
    throw memErr;
  }
}

export async function teardownTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (replSet) {
    await replSet.stop();
    replSet = null;
  }
}


import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './models/User.js';
import { Cosmetics } from './models/Cosmetics.js';
import { LeaderboardConfig } from './models/LeaderboardConfig.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/openfront';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected to MongoDB');

    // Create admin user
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        passwordHash: 'admin123', // Will be hashed by pre-save hook
        email: 'admin@openfront.local',
        role: 'admin',
        persistentId: '00000000-0000-0000-0000-000000000001',
        publicId: 'admin',
        wallet: { balance: 10000 },
      });
      await admin.save();
      console.log('[Seed] Created admin user (admin / admin123)');
    }

    // Create default leaderboard config
    const configExists = await LeaderboardConfig.findOne();
    if (!configExists) {
      await LeaderboardConfig.create({
        isEnabled: true,
        minWinsRequired: 0,
      });
      console.log('[Seed] Created default leaderboard config');
    }

    // Create sample cosmetics
    const cosmeticsCount = await Cosmetics.countDocuments();
    if (cosmeticsCount === 0) {
      const sampleCosmetics = [
        // Patterns
        { type: 'pattern', name: 'Default', price: 0, active: true },
        { type: 'pattern', name: 'Stripes', price: 100, active: true },
        { type: 'pattern', name: 'Dots', price: 150, active: true },
        { type: 'pattern', name: 'Camo', price: 200, active: true },
        { type: 'pattern', name: 'Gradient', price: 250, active: true },
        // Flags
        { type: 'flag', name: 'Skull', price: 300, active: true },
        { type: 'flag', name: 'Star', price: 300, active: true },
        { type: 'flag', name: 'Flame', price: 350, active: true },
        { type: 'flag', name: 'Lightning', price: 350, active: true },
        { type: 'flag', name: 'Crown', price: 500, active: true },
        // Skins
        { type: 'skin', name: 'Classic', price: 0, active: true },
        { type: 'skin', name: 'Neon', price: 500, active: true },
        { type: 'skin', name: 'Chrome', price: 750, active: true },
        { type: 'skin', name: 'Gold', price: 1000, active: true },
      ];

      await Cosmetics.insertMany(sampleCosmetics);
      console.log(`[Seed] Created ${sampleCosmetics.length} sample cosmetics`);
    }

    // Create test user
    const testExists = await User.findOne({ username: 'test' });
    if (!testExists) {
      const test = new User({
        username: 'test',
        passwordHash: 'test123',
        role: 'user',
        persistentId: '00000000-0000-0000-0000-000000000002',
        publicId: 'testusr',
        wallet: { balance: 1000 },
        inventory: { skins: ['Classic'], flags: ['Star'], patterns: ['Default'] },
      });
      await test.save();
      console.log('[Seed] Created test user (test / test123)');
    }

    console.log('[Seed] Done!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error:', error);
    process.exit(1);
  }
}

seed();

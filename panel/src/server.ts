import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import statsRoutes from './routes/stats.js';
import shopRoutes from './routes/shop.js';
import clanRoutes from './routes/clans.js';
import friendRoutes from './routes/friends.js';
import leaderboardRoutes from './routes/leaderboard.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4000');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/openfront';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:9000,http://localhost:4001,http://localhost:4002';

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: CORS_ORIGIN.split(',').map(s => s.trim()),
  credentials: true,
}));

// Session with MongoDB store
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    collectionName: 'sessions',
    ttl: 30 * 24 * 60 * 60, // 30 days
  }),
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    domain: 'localhost',
  },
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/clans', clanRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Connect to MongoDB and start server
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`[Panel] Connected to MongoDB`);

    app.listen(PORT, () => {
      console.log(`[Panel] Server running on http://localhost:${PORT}`);
      console.log(`[Panel] API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('[Panel] Failed to start:', error);
    process.exit(1);
  }
}

start();
